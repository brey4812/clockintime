<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:html="http://www.w3.org/TR/REC-html40" xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap - ClockInTime</title>
        <style type="text/css">
          body { font-family: sans-serif; font-size: 14px; color: #333; margin: 0; padding: 20px; background: #f4f7f9; }
          table { border-collapse: collapse; width: 100%; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          th { background: #2c3e50; color: #fff; text-align: left; padding: 12px; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          tr:hover { background: #f9f9f9; }
          h1 { color: #2c3e50; }
          .priority { font-weight: bold; color: #27ae60; }
        </style>
      </head>
      <body>
        <h1>ClockInTime Sitemap</h1>
        <p>Este mapa del sitio contiene <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs para buscadores.</p>
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
