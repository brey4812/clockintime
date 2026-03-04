<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:html="http://www.w3.org/TR/REC-html40" xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap - ClockInTime</title>
        <style type="text/css">
          /* Variables de color para modo claro */
          :root {
            --bg-color: #f4f7f9;
            --card-bg: #ffffff;
            --text-main: #333333;
            --text-header: #2c3e50;
            --border: #eeeeee;
            --accent: #27ae60;
            --link: #3498db;
          }

          /* Variables para modo oscuro (detección de sistema) */
          @media (prefers-color-scheme: dark) {
            :root {
              --bg-color: #121212;
              --card-bg: #1e1e1e;
              --text-main: #e0e0e0;
              --text-header: #87CEEB;
              --border: #333333;
              --accent: #2ecc71;
              --link: #64b5f6;
            }
          }

          body { font-family: sans-serif; font-size: 14px; color: var(--text-main); margin: 0; padding: 20px; background: var(--bg-color); }
          table { border-collapse: collapse; width: 100%; background: var(--card-bg); box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
          th { background: #2c3e50; color: #fff; text-align: left; padding: 12px; }
          td { padding: 10px; border-bottom: 1px solid var(--border); }
          tr:hover { background: rgba(255,255,255,0.05); }
          h1 { color: var(--text-header); }
          a { color: var(--link); text-decoration: none; }
          a:hover { text-decoration: underline; }
          .priority { font-weight: bold; color: var(--accent); }
          .info { margin-bottom: 20px; color: var(--text-main); }
        </style>
      </head>
      <body>
        <h1>ClockInTime Sitemap</h1>
        <div class="info">
          Este mapa del sitio contiene <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong> URLs para buscadores.
        </div>
        <table>
          <tr>
            <th>URL (Ubicación)</th>
            <th>Última Modificación</th>
            <th>Prioridad</th>
          </tr>
          <xsl:for-each select="sitemap:urlset/sitemap:url">
            <tr>
              <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
              <td><xsl:value-of select="sitemap:lastmod"/></td>
              <td class="priority"><xsl:value-of select="sitemap:priority"/></td>
            </tr>
          </xsl:for-each>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
