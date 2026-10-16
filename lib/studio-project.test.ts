import { describe, it, expect } from 'vitest';
import { EMPTY_PROJECT, mergeTranslatedCues, toSrt, validateStudioProject } from './studio-project';
import { containedRect, pointToNormalized, roiToUprightPixels, uprightSize } from './roi-geometry';
describe('studio project', () => {
  it('validates initial project', () => expect(validateStudioProject(EMPTY_PROJECT)).toEqual(EMPTY_PROJECT));
  it('preserves timestamps when translating', () => {
    const cue = { id:'1',startMs:1200,endMs:3456,sourceText:'Hello',source:'stt' as const };
    expect(mergeTranslatedCues([cue],new Map([['1','Xin chào']]))[0]).toMatchObject({startMs:1200,endMs:3456,translatedText:'Xin chào'});
  });
  it('exports valid SRT milliseconds', () => expect(toSrt([{id:'1',startMs:1200,endMs:3456,sourceText:'Xin chào',source:'ocr'}])).toContain('00:00:01,200 --> 00:00:03,456'));
  it('rejects invalid time', () => expect(() => validateStudioProject({...EMPTY_PROJECT,cues:[{id:'1',startMs:4,endMs:2,sourceText:'a',source:'ocr'}]})).toThrow());
});
describe('ROI geometry', () => {
  it('handles rotation', () => expect(uprightSize({width:1920,height:1080},90)).toEqual({width:1080,height:1920}));
  it('handles contain letterbox', () => expect(containedRect({width:400,height:400},{width:1920,height:1080}).height).toBeCloseTo(225));
  it('maps center of portrait', () => expect(pointToNormalized(200,200,{width:400,height:400},{width:1080,height:1920},0).x).toBeCloseTo(.5));
  it('maps pixel ROI', () => expect(roiToUprightPixels({x:.1,y:.2,width:.5,height:.4},{width:1920,height:1080},90)).toMatchObject({x:108,y:384,width:540,height:768}));
});
