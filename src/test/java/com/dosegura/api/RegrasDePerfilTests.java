package com.dosegura.api;

import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.model.PerfilConta;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regras de perfil e de permissão de imagem, sem subir o contexto do Spring
 * (precisa de MySQL). Os testes de integração rodam com docker compose.
 */
class RegrasDePerfilTests {

    @Test
    void contaComCpfEhPessoaFisica() {
        PacienteModel paciente = new PacienteModel();
        paciente.setCpf("11122233344");
        assertEquals(PerfilConta.PESSOA_FISICA, paciente.getPerfilConta());
        assertFalse(paciente.isPessoaJuridica());
        assertFalse(paciente.isMasterAdminConta());
    }

    @Test
    void contaComCnpjEhInstituicao() {
        PacienteModel empresa = new PacienteModel();
        empresa.setCnpj("12345678000199");
        assertEquals(PerfilConta.INSTITUICAO, empresa.getPerfilConta());
        assertTrue(empresa.isPessoaJuridica());
    }

    @Test
    void masterAdminEnviaImagemDeTodaARede() {
        PacienteModel admin = new PacienteModel();
        admin.setCpf("11122233344");
        admin.setMasterAdmin(true);
        assertTrue(admin.isMasterAdminConta());
        assertEquals(4, admin.getTiposImagemPermitidos().size());
    }

    @Test
    void pacienteSoEnviaFotoDePerfil() {
        PacienteModel paciente = new PacienteModel();
        paciente.setCpf("11122233344");
        assertEquals(java.util.List.of("PERFIL"), paciente.getTiposImagemPermitidos());
    }

    @Test
    void instituicaoGerenciaImagensDaRede() {
        PacienteModel empresa = new PacienteModel();
        empresa.setCnpj("12345678000199");
        assertEquals(
                java.util.List.of("PERFIL", "FORNECEDOR", "FARMACIA", "MEDICAMENTO"),
                empresa.getTiposImagemPermitidos());
    }
}
