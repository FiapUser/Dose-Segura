package com.dosegura.api.service;

import com.dosegura.api.exception.AcessoNegadoException;
import com.dosegura.api.exception.DadosInvalidosException;
import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.model.SolicitacaoVinculoModel;
import com.dosegura.api.repo.SolicitacaoVinculoRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Vínculo de cuidado com confirmação do destinatário.
 *
 * <p>Não existe mais vínculo imediato: para cuidar de alguém é preciso que a
 * outra conta aceite o pedido na área de notificações. Isso vale nos dois
 * sentidos (paciente pedindo cuidador e cuidador pedindo paciente) e também
 * dispensa a senha do dependente.</p>
 */
@Service
public class VinculoService {

    @Autowired
    private SolicitacaoVinculoRepo repo;

    @Autowired
    private PacienteService pacienteService;

    @Autowired
    private NotificacaoService notificacoes;

    /** Cria o pedido e dispara o alerta na área de notificações do destinatário. */
    @Transactional
    public SolicitacaoVinculoModel solicitar(Long solicitanteId, String emailDestinatario,
                                             String tipo, String mensagem) {
        PacienteModel solicitante = pacienteService.findById(solicitanteId)
                .orElseThrow(() -> new DadosInvalidosException("Conta não encontrada."));

        if (emailDestinatario == null || emailDestinatario.isBlank()) {
            throw new DadosInvalidosException("Informe o e-mail da conta que deseja vincular.");
        }
        PacienteModel destinatario = pacienteService.findByEmail(emailDestinatario.trim())
                .orElseThrow(() -> new DadosInvalidosException(
                        "Não existe conta com esse e-mail. A pessoa precisa ter cadastro no Dose Segura."));

        if (destinatario.getId().equals(solicitanteId)) {
            throw new DadosInvalidosException("Você não pode solicitar vínculo consigo mesmo.");
        }
        String tipoNormalizado = normalizarTipo(tipo);

        // Um pedido pendente igual bloqueia o reenvio, para não encher a caixa do outro.
        if (repo.findBySolicitanteIdAndDestinatarioIdAndStatus(
                solicitanteId, destinatario.getId(), SolicitacaoVinculoModel.STATUS_PENDENTE).isPresent()) {
            throw new DadosInvalidosException("Já existe um pedido pendente para essa conta.");
        }

        // A recusa anterior não impede nova tentativa depois de um tempo.
        List<SolicitacaoVinculoModel> anteriores = repo.findBySolicitanteIdAndDestinatarioId(
                solicitanteId, destinatario.getId());
        if (anteriores.stream().anyMatch(SolicitacaoVinculoModel::isPendente)) {
            throw new DadosInvalidosException("Já existe um pedido pendente para essa conta.");
        }

        SolicitacaoVinculoModel solicitacao = new SolicitacaoVinculoModel();
        solicitacao.setSolicitante(solicitante);
        solicitacao.setDestinatario(destinatario);
        solicitacao.setTipo(tipoNormalizado);
        solicitacao.setStatus(SolicitacaoVinculoModel.STATUS_PENDENTE);
        solicitacao.setCriadoEm(LocalDateTime.now());
        if (mensagem != null && !mensagem.isBlank()) {
            solicitacao.setMensagem(mensagem.trim());
        }
        SolicitacaoVinculoModel salva = repo.save(solicitacao);

        notificacoes.notificarSolicitacaoVinculo(destinatario, solicitante, tipoNormalizado, salva.getId());
        return salva;
    }

    /** O destinatário aceita: aí sim o cuidador é vinculado ao paciente. */
    @Transactional
    public SolicitacaoVinculoModel aceitar(Long solicitacaoId, Long usuarioId) {
        SolicitacaoVinculoModel solicitacao = pendenteDoDestinatario(solicitacaoId, usuarioId);
        PacienteModel paciente = pacienteService.findById(solicitacao.getDestinatario().getId())
                .orElseThrow(() -> new DadosInvalidosException("Paciente não encontrado."));
        PacienteModel responsavel = pacienteService.findById(solicitacao.getSolicitante().getId())
                .orElseThrow(() -> new DadosInvalidosException("Conta não encontrada."));

        paciente.setCuidador(responsavel);
        pacienteService.save(paciente);

        solicitacao.setStatus(SolicitacaoVinculoModel.STATUS_ACEITA);
        solicitacao.setRespondidoEm(LocalDateTime.now());
        SolicitacaoVinculoModel salva = repo.save(solicitacao);

        notificacoes.descartarPorAcao(solicitacao.getDestinatario().getId(),
                NotificacaoService.ACAO_VINCULO, solicitacaoId);
        return salva;
    }

    @Transactional
    public SolicitacaoVinculoModel recusar(Long solicitacaoId, Long usuarioId) {
        SolicitacaoVinculoModel solicitacao = pendenteDoDestinatario(solicitacaoId, usuarioId);
        solicitacao.setStatus(SolicitacaoVinculoModel.STATUS_RECUSADA);
        solicitacao.setRespondidoEm(LocalDateTime.now());
        SolicitacaoVinculoModel salva = repo.save(solicitacao);
        notificacoes.descartarPorAcao(solicitacao.getDestinatario().getId(),
                NotificacaoService.ACAO_VINCULO, solicitacaoId);
        return salva;
    }

    /** Só quem enviou pode cancelar o próprio pedido. */
    @Transactional
    public SolicitacaoVinculoModel cancelar(Long solicitacaoId, Long usuarioId) {
        SolicitacaoVinculoModel solicitacao = repo.findById(solicitacaoId)
                .orElseThrow(() -> new DadosInvalidosException("Pedido não encontrado."));
        if (!solicitacao.getSolicitante().getId().equals(usuarioId)) {
            throw new AcessoNegadoException("Apenas quem enviou o pedido pode cancelá-lo.");
        }
        if (!solicitacao.isPendente()) {
            throw new DadosInvalidosException("Este pedido já foi respondido.");
        }
        solicitacao.setStatus(SolicitacaoVinculoModel.STATUS_CANCELADA);
        solicitacao.setRespondidoEm(LocalDateTime.now());
        return repo.save(solicitacao);
    }

    public List<SolicitacaoVinculoModel> recebidos(Long usuarioId) {
        return repo.findByDestinatarioIdOrderByCriadoEmDesc(usuarioId);
    }

    public List<SolicitacaoVinculoModel> enviados(Long usuarioId) {
        return repo.findBySolicitanteIdOrderByCriadoEmDesc(usuarioId);
    }

    private SolicitacaoVinculoModel pendenteDoDestinatario(Long solicitacaoId, Long usuarioId) {
        SolicitacaoVinculoModel solicitacao = repo.findById(solicitacaoId)
                .orElseThrow(() -> new DadosInvalidosException("Pedido não encontrado."));
        if (!solicitacao.getDestinatario().getId().equals(usuarioId)) {
            throw new AcessoNegadoException("Apenas o destinatário do pedido pode responder.");
        }
        if (!solicitacao.isPendente()) {
            throw new DadosInvalidosException("Este pedido já foi respondido.");
        }
        return solicitacao;
    }

    private String normalizarTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            return SolicitacaoVinculoModel.TIPO_CUIDADO;
        }
        if (SolicitacaoVinculoModel.TIPO_RESPONSAVEL.equalsIgnoreCase(tipo.trim())) {
            return SolicitacaoVinculoModel.TIPO_RESPONSAVEL;
        }
        return SolicitacaoVinculoModel.TIPO_CUIDADO;
    }
}
