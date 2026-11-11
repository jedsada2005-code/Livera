"""Render original silent 9:16 typography videos. Requires pillow, imageio-ffmpeg, pyobjc-framework-Cocoa (macOS).
Run: python scripts/render-knowledge-clips.py (uses system Thonburi font)
No third-party footage, music, or photographs are included.
"""
import subprocess, io
from pathlib import Path
from PIL import Image, ImageDraw
from AppKit import NSBitmapImageRep, NSGraphicsContext, NSCalibratedRGBColorSpace, NSColor, NSFont, NSFontAttributeName, NSForegroundColorAttributeName, NSBitmapImageFileTypePNG
from Foundation import NSString
import imageio_ffmpeg
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/media'


OUT.mkdir(exist_ok=True)
W,H,FPS=540,960,15
def draw_text(im, xy, text, size, fill):
    # CoreText/AppKit shapes Thai marks correctly on macOS.
    rep=NSBitmapImageRep.alloc().initWithBitmapDataPlanes_pixelsWide_pixelsHigh_bitsPerSample_samplesPerPixel_hasAlpha_isPlanar_colorSpaceName_bytesPerRow_bitsPerPixel_(None,W,H,8,4,True,False,NSCalibratedRGBColorSpace,W*4,32)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.setCurrentContext_(NSGraphicsContext.graphicsContextWithBitmapImageRep_(rep))
    rgb=tuple(int(fill.lstrip('#')[i:i+2],16)/255 for i in (0,2,4))
    attrs={NSFontAttributeName:NSFont.fontWithName_size_('Thonburi',size),NSForegroundColorAttributeName:NSColor.colorWithCalibratedRed_green_blue_alpha_(*rgb,1)}
    NSString.stringWithString_(text).drawAtPoint_withAttributes_((xy[0],H-xy[1]-size*1.5),attrs)
    NSGraphicsContext.restoreGraphicsState()
    overlay=Image.open(io.BytesIO(bytes(rep.representationUsingType_properties_(NSBitmapImageFileTypePNG,{})))).convert('RGBA')
    im.paste(overlay,(0,0),overlay)

clips={
'retirement-questions': [('อยากใช้ชีวิต','แบบไหน',['ลองนึกถึงรายจ่ายต่อเดือน','และค่าใช้จ่ายพิเศษหลังเกษียณ']),('จะมีรายรับ','จากไหน',['รวบรวมรายรับที่คาดว่าจะมี','ตรวจเงื่อนไขก่อนใส่ในแผน']),('ต้องเตรียม','เผื่อแค่ไหน',['ลองเปลี่ยนเงินเฟ้อ','และจำนวนปีหลังเกษียณ'])],
'money-goal': [('รู้จุด','เริ่มต้น',['จดรายรับ รายจ่าย และภาระ','ก่อนเริ่มตั้งเป้าหมาย']),('ตั้งยอด','พร้อมวัน',['ระบุจำนวนเงินและเวลา','ให้เหมาะกับกำลังของตัวเอง']),('กลับมา','ทบทวน',['ตรวจความคืบหน้า','ปรับแผนเมื่อชีวิตเปลี่ยนไป'])]
}
for name, slides in clips.items():
    p=subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/f'{name}.mp4')],stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
    bases=[]
    for i,(a,b,lines) in enumerate(slides):
        im=Image.new('RGB',(W,H),'#172c46'); d=ImageDraw.Draw(im)
        d.ellipse((280,-110,760,370),fill='#243b54');d.ellipse((-230,630,230,1090),fill='#253b50')
        draw_text(im,(42,48),'LIVERA  /  SMALL STEPS',19,'#e6d8c8')
        d=ImageDraw.Draw(im);d.rounded_rectangle((42,135,175,178),radius=20,fill='#a84c54')
        draw_text(im,(62,139),f'0{i+1} / 03',22,'#ffffff')
        draw_text(im,(40,268),a,51,'#faf7f2');draw_text(im,(40,342),b,51,'#faf7f2')
        ImageDraw.Draw(im).rectangle((42,453,112,458),fill='#d89393')
        for j,line in enumerate(lines):draw_text(im,(42,500+j*44),line,27,'#d6dee6')
        draw_text(im,(42,750),'สื่อความรู้โดย LIVERA',22,'#f2ece2')
        draw_text(im,(42,790),'สรุปจาก ธปท. • อ่านแหล่งข้อมูลในแอป',18,'#bbc7d2')
        draw_text(im,(42,826),'คลิปข้อความ • ไม่มีเสียง',18,'#bbc7d2')
        bases.append(im)
    for frame in range(24*FPS):
        t=frame/FPS; i=min(2,int(t//8));im=bases[i].copy(); d=ImageDraw.Draw(im)
        d.rounded_rectangle((42,895,498,901),radius=3,fill='#4b5b6d');d.rounded_rectangle((42,895,42+max(6,int(456*t/24)),901),radius=3,fill='#db9398')
        if frame==0: im.save(OUT/f'{name}.webp',quality=90)
        p.stdin.write(im.tobytes())
    p.stdin.close();assert p.wait()==0
    print(name, (OUT/f'{name}.mp4').stat().st_size)
