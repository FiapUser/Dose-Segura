package com.dosegura.api.security;

import com.dosegura.api.exception.AcessoNegadoException;
import com.dosegura.api.repo.AgendaRepo;
import com.dosegura.api.repo.NotificacaoRepo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;

@Component
public class AutorizacaoInterceptor implements HandlerInterceptor {

    private static final String BASE = "/dosegura/api";

    @Autowired
    private AutorizacaoService autorizacao;

    @Autowired
    private AgendaRepo agendaRepo;

    @Autowired
    private NotificacaoRepo notificacaoRepo;

    @Override
    @SuppressWarnings("unchecked")
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        Object atributoPadrao = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        if (atributoPadrao == null) {
            return true;
        }

        String padrao = normalizar(atributoPadrao.toString());
        String metodo = request.getMethod().toUpperCase();

        if (padrao.equals("/login")
                || (padrao.equals("/paciente") && metodo.equals("POST"))
                // Recursos públicos: ilustrações da API e status do Cloudinary.
                || padrao.startsWith("/ilustracoes")) {
            return true;
        }

        autorizacao.usuarioAtual();

        Map<String, String> variaveis = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        if (variaveis == null) {
            variaveis = Map.of();
        }

        if (padrao.equals("/paciente/{id}")) {
            Long id = id(variaveis, "id");
            if (metodo.equals("DELETE")) {
                autorizacao.exigirProprioUsuario(id);
            } else {
                autorizacao.exigirAcessoAoPaciente(id);
            }
        } else if (padrao.equals("/paciente/{pacienteId}/vincular-cuidador/{cuidadorId}")) {
            autorizacao.exigirProprioUsuario(id(variaveis, "pacienteId"));
        } else if (padrao.equals("/paciente/cuidador/{cuidadorId}/dependentes")) {
            autorizacao.exigirProprioUsuario(id(variaveis, "cuidadorId"));
        } else if (padrao.equals("/relatorios/familiar/{familiarId}")) {
            autorizacao.exigirProprioUsuario(id(variaveis, "familiarId"));
        } else if (padrao.equals("/agenda/{id}/concluir") || padrao.equals("/agenda/{id}")) {
            agendaRepo.findById(id(variaveis, "id"))
                    .ifPresent(item -> autorizacao.exigirAcessoAoPaciente(item.getPaciente().getId()));
        } else if (padrao.equals("/notificacoes/{id}/ler")) {
            notificacaoRepo.findById(id(variaveis, "id"))
                    .ifPresent(item -> autorizacao.exigirAcessoAoPaciente(item.getPaciente().getId()));
        } else if (variaveis.containsKey("pacienteId")) {
            autorizacao.exigirAcessoAoPaciente(id(variaveis, "pacienteId"));
        }

        if (padrao.startsWith("/farmacias")) {
            return true;
        }

        return true;
    }

    private static Long id(Map<String, String> variaveis, String nome) {
        try {
            return Long.valueOf(variaveis.get(nome));
        } catch (NumberFormatException e) {
            throw new AcessoNegadoException();
        }
    }

    private static String normalizar(String padrao) {
        String p = padrao.replaceAll("/{2,}", "/");
        if (p.startsWith(BASE)) {
            p = p.substring(BASE.length());
        }
        if (p.length() > 1 && p.endsWith("/")) {
            p = p.substring(0, p.length() - 1);
        }
        return p.isEmpty() ? "/" : p;
    }
}
