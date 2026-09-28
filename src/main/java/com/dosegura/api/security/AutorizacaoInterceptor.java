package com.dosegura.api.security;

import com.dosegura.api.exception.AcessoNegadoException;
import com.dosegura.api.repo.AgendaRepo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;
import java.util.Set;

/**
 * Autorização por rota, executada antes dos controllers.
 *
 * <p>Rede de fornecedores, farmácias e medicamentos: leitura liberada para
 * qualquer conta autenticada; criar, editar, excluir e enviar imagens exige
 * master admin ou a instituição responsável pelo registro (mesmo CNPJ).
 * Contas de pessoa física (CPF) não administram a rede.</p>
 *
 * <p>A conferência do CNPJ do corpo da requisição acontece nos services, que já
 * recebem a entidade completa (aqui o corpo ainda não foi lido).</p>
 */
@Component
public class AutorizacaoInterceptor implements HandlerInterceptor {

    private static final String BASE = "/dosegura/api";

    private static final Set<String> METODOS_DE_ESCRITA = Set.of("POST", "PUT", "PATCH", "DELETE");

    @Autowired
    private AutorizacaoService autorizacao;

    @Autowired
    private AgendaRepo agendaRepo;

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

        Map<String, String> variaveis = (Map<String, String>) request.getAttribute(
                HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        if (variaveis == null) {
            variaveis = Map.of();
        }

        if (padrao.startsWith("/marketplace") || padrao.startsWith("/farmacias")) {
            return autorizarRede(padrao, metodo, variaveis);
        }

        if (padrao.equals("/paciente/{id}")) {
            Long id = id(variaveis, "id");
            if (metodo.equals("DELETE")) {
                autorizacao.exigirProprioUsuario(id);
            } else {
                autorizacao.exigirAcessoAoPaciente(id);
            }
        } else if (padrao.equals("/paciente/cuidador/{cuidadorId}/dependentes")) {
            autorizacao.exigirProprioUsuario(id(variaveis, "cuidadorId"));
        } else if (padrao.equals("/paciente/{pacienteId}/desvincular-cuidador")) {
            // Quem desfaz é o próprio paciente ou o cuidador atual dele.
            autorizacao.exigirAcessoAoPaciente(id(variaveis, "pacienteId"));
        } else if (padrao.equals("/relatorios/familiar/{familiarId}")) {
            autorizacao.exigirProprioUsuario(id(variaveis, "familiarId"));
        } else if (padrao.equals("/agenda/{id}/concluir") || padrao.equals("/agenda/{id}")) {
            agendaRepo.findById(id(variaveis, "id"))
                    .ifPresent(item -> autorizacao.exigirAcessoAoPaciente(item.getPaciente().getId()));
        } else if (variaveis.containsKey("pacienteId")) {
            autorizacao.exigirAcessoAoPaciente(id(variaveis, "pacienteId"));
        }

        return true;
    }

    /**
     * Fornecedores, farmácias e medicamentos.
     *
     * <ul>
     *   <li>GET: leitura liberada (a vitrine é pública para contas autenticadas);</li>
     *   <li>POST: exige perfil de rede — master admin ou instituição (CNPJ). O CNPJ
     *       informado no corpo é conferido no service;</li>
     *   <li>PUT/PATCH/DELETE: exige que o registro pertença à instituição
     *       (responsável ou mesmo CNPJ) ou ao master admin.</li>
     * </ul>
     */
    private boolean autorizarRede(String padrao, String metodo, Map<String, String> variaveis) {
        if (!METODOS_DE_ESCRITA.contains(metodo)) {
            return true;
        }

        boolean fornecedor = padrao.startsWith("/marketplace/fornecedor");
        boolean medicamento = padrao.startsWith("/marketplace/medicamento");
        boolean farmacia = padrao.startsWith("/farmacias");

        if (metodo.equals("POST")) {
            if (variaveis.containsKey("id")) {
                // POST em item existente: trata como alteração do registro.
                return exigirGestaoDeRegistro(padrao, id(variaveis, "id"), fornecedor, farmacia);
            }
            // Criação: perfil de rede (CNPJ do corpo validado no service).
            autorizacao.exigirGestaoDaRede();
            return true;
        }

        return exigirGestaoDeRegistro(padrao, id(variaveis, "id"), fornecedor, farmacia);
    }

    private boolean exigirGestaoDeRegistro(String padrao, Long id, boolean fornecedor, boolean farmacia) {
        if (padrao.startsWith("/marketplace/medicamento")) {
            autorizacao.exigirGestaoDeMedicamento(id);
        } else if (fornecedor) {
            autorizacao.exigirGestaoDeFornecedor(id);
        } else if (farmacia) {
            autorizacao.exigirGestaoDeFarmacia(id);
        } else {
            autorizacao.exigirGestaoDaRede();
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
