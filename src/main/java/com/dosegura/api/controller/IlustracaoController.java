package com.dosegura.api.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Ilustrações geradas pela própria aplicação (SVG), usadas quando ainda não há
 * imagem enviada ao Cloudinary. Mantém a identidade visual de farmácia/saúde
 * (cross, cápsula, compressor) em azul e verde em todo o catálogo.
 */
@RestController
@RequestMapping("/dosegura/api/ilustracoes")
public class IlustracaoController {

    private static final List<String> PALETA = List.of("#0B4ED8", "#12B76A", "#E6F6EF", "#F2F7FF");

    @GetMapping(value = "/{tipo}/{nome}", produces = "image/svg+xml")
    public ResponseEntity<byte[]> ilustrar(
            @PathVariable String tipo,
            @PathVariable String nome,
            @RequestParam(value = "rotulo", required = false) String rotulo) {
        String svg = switch (tipo.toLowerCase()) {
            case "medicamento" -> svgMedicamento(rotulo == null || rotulo.isBlank() ? nome : rotulo);
            case "farmacia" -> svgLoja(rotulo == null || rotulo.isBlank() ? nome : rotulo, "cross");
            case "fornecedor" -> svgLoja(rotulo == null || rotulo.isBlank() ? nome : rotulo, "pill");
            default -> svgPerfil(rotulo == null || rotulo.isBlank() ? nome : rotulo);
        };
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("image/svg+xml"))
                .body(svg.getBytes(StandardCharsets.UTF_8));
    }

    private String svgMedicamento(String nome) {
        return """
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480" role="img" aria-label="%s">
                  <defs>
                    <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%%" stop-color="%s"/><stop offset="100%%" stop-color="%s"/>
                    </linearGradient>
                  </defs>
                  <rect width="640" height="480" fill="url(#fundo)"/>
                  <circle cx="520" cy="90" r="150" fill="%s" opacity="0.25"/>
                  <g transform="rotate(-18 320 220)">
                    <rect x="180" y="180" width="280" height="80" rx="40" fill="#ffffff" opacity="0.95"/>
                    <path d="M320 180h100a40 40 0 0 1 40 40 40 40 0 0 1-40 40H320z" fill="%s"/>
                    <rect x="316" y="180" width="8" height="80" fill="#0B2545" opacity="0.25"/>
                  </g>
                  <g fill="#ffffff" opacity="0.9">
                    <rect x="300" y="320" width="14" height="46" rx="7"/>
                    <rect x="284" y="336" width="46" height="14" rx="7"/>
                  </g>
                </svg>
                """.formatted(escapar(nome), PALETA.get(3), PALETA.get(2), PALETA.get(2), PALETA.get(1));
    }

    private String svgLoja(String nome, String simbolo) {
        String marca = "cross".equals(simbolo)
                ? "<path d='M120 96h26v26h26v26h-26v26h-26v-26H94v-26h26z' fill='%s'/>"
                        .formatted(PALETA.get(0))
                : "<g transform='rotate(-20 133 122)'><rect x='100' y='96' width='66' height='52' rx='26' fill='%s'/>"
                        + "<path d='M133 96h0a26 26 0 0 1 0 52z' fill='#ffffff'/></g>".formatted(PALETA.get(0));
        return """
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480" role="img" aria-label="%s">
                  <rect width="640" height="480" fill="%s"/>
                  <rect x="0" y="330" width="640" height="150" fill="%s" opacity="0.5"/>
                  <g transform='translate(40 0)'>%s</g>
                  <rect x="180" y="60" width="420" height="260" rx="26" fill="#ffffff" opacity="0.92"/>
                  <rect x="215" y="105" width="120" height="180" rx="12" fill="%s" opacity="0.35"/>
                  <rect x="360" y="105" width="205" height="80" rx="12" fill="%s" opacity="0.25"/>
                  <rect x="360" y="205" width="205" height="80" rx="12" fill="%s" opacity="0.25"/>
                </svg>
                """.formatted(escapar(nome), PALETA.get(3), PALETA.get(2), marca, PALETA.get(0), PALETA.get(1),
                PALETA.get(1));
    }

    private String svgPerfil(String nome) {
        String iniciais = iniciais(nome);
        return """
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320" role="img" aria-label="%s">
                  <defs>
                    <linearGradient id="p" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%%" stop-color="%s"/><stop offset="100%%" stop-color="%s"/>
                    </linearGradient>
                  </defs>
                  <rect width="320" height="320" rx="160" fill="url(#p)"/>
                  <text x="160" y="200" font-family="Helvetica,Arial,sans-serif" font-size="120" font-weight="bold"
                        fill="#ffffff" text-anchor="middle">%s</text>
                </svg>
                """.formatted(escapar(nome), PALETA.get(0), PALETA.get(1), iniciais);
    }

    private String iniciais(String nome) {
        String[] partes = nome == null ? new String[0] : nome.trim().split("\\s+");
        if (partes.length == 0 || partes[0].isBlank()) {
            return "DS";
        }
        StringBuilder resultado = new StringBuilder();
        resultado.append(partes[0].charAt(0));
        if (partes.length > 1 && !partes[partes.length - 1].isBlank()) {
            resultado.append(partes[partes.length - 1].charAt(0));
        }
        return resultado.toString().toUpperCase();
    }

    private String escapar(String texto) {
        return texto == null ? "" : texto.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&apos;");
    }
}
