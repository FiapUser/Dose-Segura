package com.dosegura.api;

import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.model.PerfilConta;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regras de perfil e de permissão, sem subir o contexto do Spring
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
    void cnpjPrevaleceSobrePerfilAntigoGravado() {
        // Cadastro antigo gravou PESSOA_FISICA, mas a conta tem CNPJ.
        PacienteModel empresa = new PacienteModel();
        empresa.setPerfil(PerfilConta.PESSOA_FISICA.name());
        empresa.setCnpj("61.774.267/0001-00");
        assertEquals(PerfilConta.INSTITUICAO, empresa.getPerfilConta());
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
    void pacienteSoEnviaFotoDePerfilENaoGerenciaRede() {
        PacienteModel paciente = new PacienteModel();
        paciente.setCpf("11122233344");
        assertEquals(java.util.List.of("PERFIL"), paciente.getTiposImagemPermitidos());
        assertFalse(paciente.isPodeGerenciarRede(),
                "conta de pessoa física não pode criar/editar/excluir registros da rede");
    }

    @Test
    void instituicaoGerenciaImagensERede() {
        PacienteModel empresa = new PacienteModel();
        empresa.setCnpj("61.774.267/0001-00");
        assertEquals(
                java.util.List.of("PERFIL", "FORNECEDOR", "FARMACIA", "MEDICAMENTO"),
                empresa.getTiposImagemPermitidos());
        assertTrue(empresa.isPodeGerenciarRede());
    }

    @Test
    void masterAdminTambemGerenciaRede() {
        PacienteModel admin = new PacienteModel();
        admin.setCnpj("61.774.267/0001-00");
        admin.setMasterAdmin(true);
        assertTrue(admin.isPodeGerenciarRede());
    }

    @Test
    void comparacaoDeCnpjIgnoraPontuacao() {
        assertEquals("61774267000100",
                com.dosegura.api.security.AutorizacaoService.somenteDigitos("61.774.267/0001-00"));
        assertEquals("61774267000100",
                com.dosegura.api.security.AutorizacaoService.somenteDigitos("61774267000100"));
        assertEquals("", com.dosegura.api.security.AutorizacaoService.somenteDigitos(null));
    }
}
