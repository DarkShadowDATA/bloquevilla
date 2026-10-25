"""Cambia la tarjeta final de un clip ya hecho sin volver a grabarlo.
Uso: python cambiar_final.py entrada.mp4 salida.mp4
"""
import io, subprocess, sys
from PIL import Image
from edit import end_card, W, H, GX, GW, GH, BAND
from cap import FPS

src, dst = sys.argv[1], sys.argv[2]
END = int(2.6 * FPS)
total = int(subprocess.check_output(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0',
                                     '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', src]).decode().strip())
keep = total - END
# último cuadro de juego, para el fondo desenfocado de la tarjeta
png = subprocess.check_output(['ffmpeg', '-loglevel', 'error', '-i', src, '-vf', f'select=eq(n\\,{keep - 1})',
                               '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'])
last = Image.open(io.BytesIO(png)).convert('RGB').crop((GX, BAND, GX + GW, BAND + GH)).resize((1080, 1920))
cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', src,
       '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
       '-filter_complex', f'[0:v]trim=end_frame={keep},setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0[v]',
       '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p',
       '-c:a', 'copy', '-movflags', '+faststart', dst]
p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
for k in range(END):
    p.stdin.write(end_card(last, k, END).tobytes())
p.stdin.close()
p.wait()
print('listo', dst, 'cuadros', total)
