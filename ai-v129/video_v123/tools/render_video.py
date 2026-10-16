#!/usr/bin/env python3
"""Render a video with subtitle burn-in, source subtitle cover, zoom and synced dubbing.
Requires ffmpeg and ffprobe. Usage: python tools/render_video.py render-job.json
Local filesystem paths in JSON must be accessible to the machine running this script.
"""
import argparse
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import shutil


def run(args):
    subprocess.run(args, check=True)


def probe(path):
    p = subprocess.run(['ffprobe','-v','error','-show_entries','stream=codec_type','-of','json',str(path)],capture_output=True,text=True,check=True)
    return [x['codec_type'] for x in json.loads(p.stdout).get('streams', [])]


def esc_filter(path):
    return str(path).replace('\\','\\\\').replace(':','\\:').replace("'","\\'").replace('[','\\[').replace(']','\\]').replace(',','\\,')


def norm_rect(c):
    x,y,w,h = (float(c[k]) for k in ('x','y','width','height'))
    if not (0<=x<=1 and 0<=y<=1 and 0<w<=1 and 0<h<=1 and x+w<=1 and y+h<=1):
        raise ValueError('Cover coordinates must be normalized to [0,1] and within video')
    return x,y,w,h


def encoder_available(name):
    result = subprocess.run(['ffmpeg', '-hide_banner', '-encoders'], capture_output=True, text=True)
    return result.returncode == 0 and any(line.split()[1] == name for line in result.stdout.splitlines() if len(line.split()) > 1 and line.lstrip().startswith('V'))


def get_profile(job):
    profile = job.get('performance', {}) or {}
    preset = profile.get('mode', 'balanced')
    if preset not in ('fast', 'balanced', 'quality'):
        raise ValueError('performance.mode must be fast, balanced or quality')
    threads = profile.get('threads', 0)
    if not isinstance(threads, int) or threads < 0 or threads > 32:
        raise ValueError('performance.threads must be an integer from 0 to 32')
    encoder = profile.get('encoder', 'auto')
    if encoder not in ('auto', 'software', 'mediacodec'):
        raise ValueError('performance.encoder must be auto, software or mediacodec')
    return preset, threads, encoder


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('job',help='Render job JSON')
    args=ap.parse_args()
    job_path=Path(args.job).resolve()
    job=json.loads(job_path.read_text(encoding='utf-8'))
    perf_mode, threads, encoder_choice = get_profile(job)
    base=job_path.parent
    def resolved(value):
        p=Path(value).expanduser()
        return p if p.is_absolute() else (base/p).resolve()
    video=resolved(job['video']); output=resolved(job.get('output','video-hoan-chinh.mp4'))
    if not video.is_file(): raise FileNotFoundError(video)
    if video==output: raise ValueError('Output must differ from input')
    zoom=float(job.get('zoom',1)); dx=float(job.get('offsetX',0)); dy=float(job.get('offsetY',0))
    if not (1<=zoom<=3 and -1<=dx<=1 and -1<=dy<=1): raise ValueError('Invalid zoom or offsets')
    cover=job.get('cover',{}); cover_mode=cover.get('mode','none')
    if cover_mode not in ('none','solid','blur'): raise ValueError('Invalid cover mode')
    vf=[]
    if zoom!=1:
        # Crop centered by default, with signed pan offsets in [-1,1].
        cw=f'iw/{zoom}'; ch=f'ih/{zoom}'
        vf.append(f'crop={cw}:{ch}:(iw-ow)/2+({dx})*(iw-ow)/2:(ih-oh)/2+({dy})*(ih-oh)/2')
        vf.append(f'scale=iw*{zoom}:ih*{zoom}:flags=lanczos')
    if cover_mode!='none':
        x,y,w,h=norm_rect(cover)
        # Solid cover is intentionally used for blur mode when portable FFmpeg cannot
        # guarantee an exact blur crop. Do not silently pretend this is a blur.
        if cover_mode=='blur':
            print('Warning: blur cover requires a specialized filter graph; using solid cover.',file=sys.stderr)
        vf.append(f'drawbox=x=iw*{x}:y=ih*{y}:w=iw*{w}:h=ih*{h}:color=black@1:t=fill')
    subtitle=job.get('subtitle')
    if subtitle:
        srt=resolved(subtitle)
        if not srt.is_file(): raise FileNotFoundError(srt)
        style=job.get('subtitleStyle',{})
        font=int(style.get('fontSize',22)); margin=int(style.get('marginV',28)); outline=int(style.get('outline',2))
        if not (8<=font<=80 and 0<=margin<=400 and 0<=outline<=10): raise ValueError('Invalid subtitle style')
        vf.append(f"subtitles='{esc_filter(srt)}':force_style='FontSize={font},MarginV={margin},Outline={outline},Alignment=2'")
    cmd=['ffmpeg','-hide_banner','-y','-i',str(video)]
    voices=job.get('voiceSegments') or []
    dubbed=job.get('dubbedAudio')
    if dubbed and voices: raise ValueError('Use either dubbedAudio or voiceSegments, not both')
    if dubbed:
        p=resolved(dubbed)
        if not p.is_file(): raise FileNotFoundError(p)
        cmd+=['-i',str(p)]
    for item in voices:
        p=resolved(item['file'])
        if not p.is_file(): raise FileNotFoundError(p)
        if not (0<=int(item['startMs'])<int(item['endMs'])): raise ValueError('Invalid voice timestamps')
        cmd+=['-i',str(p)]
    graph=[]; video_map='0:v:0'
    if vf:
        graph.append('[0:v:0]'+','.join(vf)+'[v]'); video_map='[v]'
    mode=job.get('voiceMode','original')
    if mode not in ('original','mix','replace'): raise ValueError('Invalid voiceMode')
    original_has_audio='audio' in probe(video)
    audio_map=None
    vol_orig=float(job.get('originalVolume',0.25)); vol_dub=float(job.get('dubbedVolume',1))
    if not (0<=vol_orig<=2 and 0<=vol_dub<=2): raise ValueError('Invalid audio volume')
    if mode=='original':
        if original_has_audio: audio_map='0:a:0'
    else:
        tracks=[]
        if mode=='mix' and original_has_audio:
            graph.append(f'[0:a:0]volume={vol_orig}[orig]'); tracks.append('[orig]')
        if dubbed:
            graph.append(f'[1:a:0]volume={vol_dub},apad[dub]'); tracks.append('[dub]')
        for i,item in enumerate(voices,1):
            start=int(item['startMs']); end=int(item['endMs'])
            # Atempo bounds are enforced by using atrim only; long cues are trimmed, never
            # silently shifted. The next segment always starts at its requested timestamp.
            duration=(end-start)/1000
            graph.append(f'[{i}:a:0]atrim=0:{duration:.3f},asetpts=PTS-STARTPTS,volume={vol_dub},adelay={start}:all=1,apad[seg{i}]')
            tracks.append(f'[seg{i}]')
        if not tracks: raise ValueError('No audio for requested voice mode')
        if len(tracks)==1:
            audio_map=tracks[0]
        else:
            graph.append(''.join(tracks)+f'amix=inputs={len(tracks)}:duration=longest:dropout_transition=0[aout]')
            audio_map='[aout]'
    if graph: cmd+=['-filter_complex',';'.join(graph)]
    cmd+=['-map',video_map]
    if audio_map: cmd+=['-map',audio_map,'-c:a','aac','-b:a','192k']
    else: cmd+=['-an']
    # When the video is unchanged, avoid re-encoding it entirely.
    needs_video_filter = bool(vf)
    if not needs_video_filter:
        cmd += ['-c:v', 'copy']
        print('Video stream copy enabled (no visual filters).')
    else:
        can_hw = encoder_available('h264_mediacodec')
        use_hw = encoder_choice == 'mediacodec' or (encoder_choice == 'auto' and can_hw and perf_mode == 'fast')
        if use_hw and can_hw:
            # MediaCodec is only available on certain Android FFmpeg builds/devices.
            # Hardware encoders may reject pixel formats or filters; explicit opt-in makes failures visible.
            cmd += ['-c:v', 'h264_mediacodec', '-b:v', {'fast':'3M','balanced':'5M','quality':'8M'}[perf_mode]]
            print('Using Android MediaCodec encoder.')
        else:
            if encoder_choice == 'mediacodec':
                print('Warning: h264_mediacodec unavailable; falling back to libx264.', file=sys.stderr)
            if not encoder_available('libx264'):
                raise ValueError('FFmpeg has neither usable h264_mediacodec nor libx264 encoder')
            ff_preset, crf = {'fast':('ultrafast','25'), 'balanced':('veryfast','21'), 'quality':('medium','18')}[perf_mode]
            cmd += ['-c:v', 'libx264', '-preset', ff_preset, '-crf', crf, '-pix_fmt', 'yuv420p']
            if threads:
                cmd += ['-threads:v', str(threads)]
    cmd += ['-movflags', '+faststart', '-shortest', '-progress', 'pipe:2', '-nostats', str(output)]
    print('Rendering:',output)
    run(cmd)
    print('Complete:',output)

if __name__=='__main__':
    try: main()
    except (ValueError,FileNotFoundError,subprocess.CalledProcessError) as e:
        print('Render failed:',e,file=sys.stderr);sys.exit(1)
