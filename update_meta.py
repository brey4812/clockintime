from pathlib import Path
import re

root = Path(r'c:\Users\alumno\Desktop\clockintime-main')
files = list(root.rglob('*.html'))

meta_blocks = {
    'index.html': 'clockInTime es la plataforma para control horario, fichajes, ausencias, tareas y gestión de equipos en empresas.',
}

for path in sorted(files):
    text = path.read_text(encoding='utf-8')
    if '<head>' not in text or '</head>' not in text:
        continue
    title_m = re.search(r'<title>(.*?)</title>', text, re.I | re.S)
    title = title_m.group(1).strip() if title_m else 'clockInTime'
    title_lower = title.lower()
    if title in meta_blocks:
        desc = meta_blocks[title]
    elif 'iniciar sesión' in title_lower or 'login' in title_lower:
        desc = 'Accede a tu portal de empleado de clockInTime para gestionar fichajes, horarios y solicitudes de forma segura.'
    elif 'registrarse' in title_lower or 'register' in title_lower:
        desc = 'Regístrate en clockInTime y empieza a gestionar tu equipo, fichajes, ausencias y tareas en un mismo lugar.'
    elif 'recuperar contraseña' in title_lower or 'forgot' in title_lower:
        desc = 'Recupera tu contraseña de clockInTime y vuelve a acceder a tu cuenta de empleado rápidamente.'
    elif 'admin' in title_lower and 'dashboard' in title_lower:
        desc = 'Panel de administración global de clockInTime. Supervisa métricas, gestiona usuarios y configura tu empresa.'
    elif 'gestión de usuarios' in title_lower:
        desc = 'Administra empleados, roles y permisos desde el panel de administración de clockInTime.'
    elif 'configuración' in title_lower:
        desc = 'Configura ajustes y políticas de la plataforma clockInTime desde el panel administrativo.'
    elif 'calendario' in title_lower and 'equipo' in title_lower:
        desc = 'Visualiza el calendario del equipo y gestiona eventos y turnos desde clockInTime.'
    elif 'solicitudes' in title_lower and 'ausencia' in title_lower:
        desc = 'Gestiona solicitudes de ausencias, permisos y vacaciones desde el panel administrativo.'
    elif 'mi perfil' in title_lower and 'administrador' in title_lower:
        desc = 'Edita los datos de tu perfil de administrador y gestiona tus preferencias en clockInTime.'
    elif 'calendario' in title_lower:
        desc = 'Consulta tu calendario laboral, turnos y vacaciones en clockInTime.'
    elif 'solicitudes' in title_lower:
        desc = 'Gestiona tus solicitudes de vacaciones, bajas médicas y permisos en clockInTime.'
    elif 'tareas' in title_lower:
        desc = 'Organiza tus tareas, proyectos y pendientes en el tablero de clockInTime.'
    elif 'mi perfil' in title_lower:
        desc = 'Gestiona tus datos personales, contraseña y preferencias de usuario en clockInTime.'
    elif 'fichajes' in title_lower:
        desc = 'Consulta tu historial de fichajes, horas trabajadas y control horario en clockInTime.'
    elif 'términos' in title_lower:
        desc = 'Consulta los Términos de Servicio de clockInTime para conocer derechos y condiciones de uso.'
    elif 'privacidad' in title_lower:
        desc = 'Lee la Política de Privacidad de clockInTime y descubre cómo protegemos tus datos.'
    elif 'cookies' in title_lower:
        desc = 'Consulta la Política de Cookies de clockInTime y cómo gestionamos los datos de navegación.'
    elif 'dashboard' in title_lower:
        desc = 'Resumen de fichajes, estado del equipo y accesos rápidos en clockInTime.'
    else:
        desc = 'clockInTime es la plataforma para control horario, fichajes, ausencias, tareas y gestión de equipos en empresas.'

    new_lines = []
    modified = False
    for line in text.splitlines():
        new_lines.append(line)
        if line.strip().startswith('<meta name="viewport" content="width=device-width, initial-scale=1.0">'):
            if 'meta name="description"' not in text:
                new_lines.append(f'    <meta name="description" content="{desc}">')
                modified = True
            if 'meta name="keywords"' not in text:
                new_lines.append('    <meta name="keywords" content="clockInTime, control horario, fichajes, gestión de empleados, ausencias, tareas, calendario">')
                modified = True
            if 'meta name="author"' not in text:
                new_lines.append('    <meta name="author" content="clockInTime">')
                modified = True
            if 'meta name="theme-color"' not in text:
                new_lines.append('    <meta name="theme-color" content="#0056b3">')
                modified = True
            if 'meta name="mobile-web-app-capable"' not in text:
                new_lines.append('    <meta name="mobile-web-app-capable" content="yes">')
                modified = True
            if 'meta name="apple-mobile-web-app-capable"' not in text:
                new_lines.append('    <meta name="apple-mobile-web-app-capable" content="yes">')
                modified = True
            if 'meta name="apple-mobile-web-app-status-bar-style"' not in text:
                new_lines.append('    <meta name="apple-mobile-web-app-status-bar-style" content="default">')
                modified = True
            if 'meta name="format-detection"' not in text:
                new_lines.append('    <meta name="format-detection" content="telephone=no">')
                modified = True
            if 'property="og:type"' not in text:
                new_lines.append('    <meta property="og:type" content="website">')
                modified = True
            if 'property="og:title"' not in text:
                new_lines.append(f'    <meta property="og:title" content="{title}">')
                modified = True
            if 'property="og:description"' not in text:
                new_lines.append(f'    <meta property="og:description" content="{desc}">')
                modified = True
            if 'property="og:image"' not in text:
                new_lines.append('    <meta property="og:image" content="https://iili.io/fzg2rNt.png">')
                modified = True
            if 'name="twitter:card"' not in text:
                new_lines.append('    <meta name="twitter:card" content="summary_large_image">')
                modified = True
            if 'name="twitter:title"' not in text:
                new_lines.append(f'    <meta name="twitter:title" content="{title}">')
                modified = True
            if 'name="twitter:description"' not in text:
                new_lines.append(f'    <meta name="twitter:description" content="{desc}">')
                modified = True
            if 'name="twitter:image"' not in text:
                new_lines.append('    <meta name="twitter:image" content="https://iili.io/fzg2rNt.png">')
                modified = True
    if modified:
        path.write_text('\n'.join(new_lines) + '\n', encoding='utf-8')
        print(f'Updated {path}')
