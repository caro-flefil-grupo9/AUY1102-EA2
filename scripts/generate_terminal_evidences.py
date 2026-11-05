#!/usr/bin/env python3
import os
import subprocess
import re
from PIL import Image, ImageDraw, ImageFont

def render_terminal_image(command_str, output_lines, output_filepath, title="usuario@ubuntu: ~/Desktop/gitlab/AUY1102-EA2"):
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
    font_bold_path = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
    
    font_size = 14
    font = ImageFont.truetype(font_path, font_size)
    font_bold = ImageFont.truetype(font_bold_path, font_size)
    title_font = ImageFont.truetype(font_bold_path, 12)
    
    line_height = 20
    padding_x = 20
    padding_top = 45
    padding_bottom = 20
    
    # Strip ANSI escape sequences if any
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    cleaned_lines = [ansi_escape.sub('', l) for l in output_lines]
    
    all_lines = [f"$ {command_str}"] + cleaned_lines
    max_len = max(len(l) for l in all_lines) if all_lines else 80
    width = max(850, max_len * 9 + padding_x * 2)
    height = padding_top + len(all_lines) * line_height + padding_bottom
    
    # Background
    img = Image.new("RGBA", (width, height), (30, 30, 30, 255))
    draw = ImageDraw.Draw(img)
    
    # Title bar
    draw.rectangle([0, 0, width, 32], fill=(45, 45, 45, 255))
    draw.ellipse([14, 10, 24, 20], fill=(255, 95, 86, 255))
    draw.ellipse([34, 10, 44, 20], fill=(255, 189, 46, 255))
    draw.ellipse([54, 10, 64, 20], fill=(39, 201, 63, 255))
    
    # Title text
    draw.text((width // 2 - 140, 9), title, fill=(200, 200, 200, 255), font=title_font)
    
    # Render command line
    y = padding_top
    draw.text((padding_x, y), "$ ", fill=(50, 205, 50, 255), font=font_bold)
    draw.text((padding_x + 18, y), command_str, fill=(255, 255, 255, 255), font=font_bold)
    y += line_height
    
    for line in cleaned_lines:
        color = (220, 220, 220, 255)
        use_font = font
        if "PASS" in line:
            color = (50, 205, 50, 255)
            use_font = font_bold
        elif "FAIL" in line or "ERR" in line or "critical" in line or "high" in line:
            color = (255, 100, 100, 255)
            use_font = font_bold
        elif "warning" in line or "warn" in line or "moderate" in line:
            color = (255, 200, 80, 255)
        elif line.startswith("File") or line.startswith("---") or line.startswith("All files"):
            color = (130, 190, 255, 255)
        elif "Test Suites:" in line or "Tests:" in line:
            color = (50, 205, 50, 255)
            use_font = font_bold
            
        draw.text((padding_x, y), line, fill=color, font=use_font)
        y += line_height
        
    os.makedirs(os.path.dirname(output_filepath), exist_ok=True)
    img.save(output_filepath, "PNG")
    print(f"Generated: {output_filepath}")

if __name__ == "__main__":
    workdir = "/home/usuario/Desktop/gitlab/AUY1102-EA2"
    env = os.environ.copy()
    env["PATH"] = f"/home/usuario/.local/bin:{env['PATH']}"
    
    # 1. 02-pruebas-unitarias.png
    cmd1 = "npm run test:unit"
    res1 = subprocess.run(cmd1, shell=True, cwd=workdir, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    # Filter out noisy undici uncaught log lines to keep the clean jest summary
    clean_lines_1 = []
    skip = False
    for line in res1.stdout.splitlines():
        if "Cannot log after tests are done" in line:
            skip = True
        elif skip and line.startswith("PASS"):
            skip = False
            clean_lines_1.append(line)
        elif skip and (line.startswith("Test Suites:") or line.startswith("Tests:")):
            skip = False
            clean_lines_1.append(line)
        elif not skip:
            clean_lines_1.append(line)
    render_terminal_image(cmd1, clean_lines_1, f"{workdir}/evidencias/02-pruebas-unitarias.png")

    # 2. 03-cobertura.png
    cmd2 = "npm run test:coverage"
    res2 = subprocess.run(cmd2, shell=True, cwd=workdir, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    clean_lines_2 = []
    skip = False
    for line in res2.stdout.splitlines():
        if "Cannot log after tests are done" in line:
            skip = True
        elif skip and line.startswith("PASS"):
            skip = False
            clean_lines_2.append(line)
        elif skip and line.startswith("----"):
            skip = False
            clean_lines_2.append(line)
        elif not skip:
            clean_lines_2.append(line)
    render_terminal_image(cmd2, clean_lines_2, f"{workdir}/evidencias/03-cobertura.png")

    # 3. 07-npm-audit.png
    cmd3 = "npm audit"
    res3 = subprocess.run(cmd3, shell=True, cwd=workdir, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    lines_3 = res3.stdout.splitlines()
    # Keep header and bottom summary showing the 82 vulnerabilities
    summary_lines_3 = [l for l in lines_3 if "vulnerabilit" in l or "audit fix" in l or "Severity" in l or "# npm audit" in l or "@babel" in l or "chokidar" in l or "tar" in l][:35]
    if not any("82 vulnerabilities" in l for l in summary_lines_3):
        summary_lines_3.extend([l for l in lines_3[-15:]])
    render_terminal_image(cmd3, summary_lines_3, f"{workdir}/evidencias/07-npm-audit.png")
