package com.dosegura.api.config;

import com.dosegura.api.model.AgendaModel;
import com.dosegura.api.repo.AgendaRepo;
import com.dosegura.api.model.EstoquePacienteModel;
import com.dosegura.api.model.FarmaciaModel;
import com.dosegura.api.model.FornecedorModel;
import com.dosegura.api.model.MedicamentoModel;
import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.model.PerfilConta;
import com.dosegura.api.repo.EstoquePacienteRepo;
import com.dosegura.api.repo.FarmaciaRepo;
import com.dosegura.api.repo.FornecedorRepo;
import com.dosegura.api.repo.MedicamentoRepo;
import com.dosegura.api.repo.Repo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Carga inicial: conta master admin, contas de exemplo e a vitrine do
 * marketplace (fornecedores, farmácias e medicamentos) para que a interface de
 * loja já abra com conteúdo. As imagens são enviadas depois pelo Cloudinary,
 * via tela de gestão; sem imagem, a API serve a ilustração padrão.
 */
@Component
public class DadosIniciais implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DadosIniciais.class);

    private final boolean habilitado;
    private final Repo pacienteRepo;
    private final FornecedorRepo fornecedorRepo;
    private final FarmaciaRepo farmaciaRepo;
    private final MedicamentoRepo medicamentoRepo;
    private final EstoquePacienteRepo estoqueRepo;
    private final AgendaRepo agendaRepo;
    private final PasswordEncoder passwordEncoder;

    private final String adminEmail;
    private final String adminSenha;
    private final String adminNome;
    private final String pacienteEmail;
    private final String pacienteSenha;
    private final String cuidadorEmail;
    private final String cuidadorSenha;

    public DadosIniciais(
            Repo pacienteRepo,
            FornecedorRepo fornecedorRepo,
            FarmaciaRepo farmaciaRepo,
            MedicamentoRepo medicamentoRepo,
            EstoquePacienteRepo estoqueRepo,
            AgendaRepo agendaRepo,
            PasswordEncoder passwordEncoder,
            @Value("${dosegura.seed.enabled:true}") boolean habilitado,
            @Value("${dosegura.seed.master-admin.email}") String adminEmail,
            @Value("${dosegura.seed.master-admin.senha}") String adminSenha,
            @Value("${dosegura.seed.master-admin.nome}") String adminNome,
            @Value("${dosegura.seed.demo-paciente.email}") String pacienteEmail,
            @Value("${dosegura.seed.demo-paciente.senha}") String pacienteSenha,
            @Value("${dosegura.seed.demo-cuidador.email}") String cuidadorEmail,
            @Value("${dosegura.seed.demo-cuidador.senha}") String cuidadorSenha) {
        this.habilitado = habilitado;
        this.pacienteRepo = pacienteRepo;
        this.fornecedorRepo = fornecedorRepo;
        this.farmaciaRepo = farmaciaRepo;
        this.medicamentoRepo = medicamentoRepo;
        this.estoqueRepo = estoqueRepo;
        this.agendaRepo = agendaRepo;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminSenha = adminSenha;
        this.adminNome = adminNome;
        this.pacienteEmail = pacienteEmail;
        this.pacienteSenha = pacienteSenha;
        this.cuidadorEmail = cuidadorEmail;
        this.cuidadorSenha = cuidadorSenha;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!habilitado) {
            log.info("Carga inicial desativada (DOSEGURA_SEED_ENABLED=false).");
            return;
        }
        try {
            PacienteModel masterAdmin = garantirContas();
            if (fornecedorRepo.count() == 0) {
                garantirMarketplace(masterAdmin);
                log.info("Vitrine do marketplace criada.");
            }
            if (pacienteRepo.findByEmail(pacienteEmail).isPresent()) {
                garantirRotina(pacienteRepo.findByEmail(pacienteEmail).orElseThrow());
            }
        } catch (RuntimeException e) {
            log.warn("Carga inicial ignorada: {}", e.getMessage());
        }
    }

    private PacienteModel garantirContas() {
        PacienteModel masterAdmin = pacienteRepo.findByEmail(adminEmail)
                .orElseGet(() -> conta(adminNome, adminEmail, adminSenha, "MASTER_ADMIN", true, null));
        if (Boolean.FALSE.equals(masterAdmin.getMasterAdmin())) {
            masterAdmin.setMasterAdmin(true);
            masterAdmin = pacienteRepo.save(masterAdmin);
        }
        if (Boolean.FALSE.equals(masterAdmin.getPerfilConta().isPessoaJuridica())) {
            masterAdmin.setPerfil(PerfilConta.MASTER_ADMIN.name());
            pacienteRepo.save(masterAdmin);
        }

        pacienteRepo.findByEmail(cuidadorEmail)
                .orElseGet(() -> conta("Marta Ribeiro Cuidadora", cuidadorEmail, cuidadorSenha,
                        PerfilConta.PESSOA_FISICA.name(), false, null));

        pacienteRepo.findByEmail(pacienteEmail).orElseGet(() -> {
            PacienteModel paciente = conta("Joao dos Santos", pacienteEmail, pacienteSenha,
                    PerfilConta.PESSOA_FISICA.name(), false, "52998224725");
            paciente.setIdade(68);
            paciente.setAlergias("Penicilina");
            paciente.setHistoricoMedico("Hipertensão arterial e diabetes tipo 2.");
            paciente.setMedicamentosEmUso("Losartana 50mg, Metformina 850mg, AAS 100mg");
            paciente.setContatosEmergencia("Marta Ribeiro - (11) 98888-7777");
            paciente.setObservacoesMedicas("Uso contínuo. Consultar médico antes de alterar doses.");
            paciente.setCuidador(pacienteRepo.findByEmail(cuidadorEmail).orElse(null));
            return pacienteRepo.save(paciente);
        });
        return masterAdmin;
    }

    private PacienteModel conta(String nome, String email, String senha, String perfil, boolean masterAdmin, String cpf) {
        PacienteModel conta = new PacienteModel();
        conta.setNome(nome);
        conta.setEmail(email);
        conta.setSenha(passwordEncoder.encode(senha));
        conta.setPerfil(perfil);
        conta.setMasterAdmin(masterAdmin);
        conta.setCpf(cpf);
        return pacienteRepo.save(conta);
    }

    private void garantirMarketplace(PacienteModel responsavel) {
        FornecedorModel eurofarma = fornecedor("Eurofarma Brasil", "61.774.267/0001-00",
                "Av. Fagundes Filho, 620 - São Paulo/SP", "(11) 4002-8922", 4.9,
                "Distribuidora parceira do Dose Segura, responsável por grande parte do portfólio de medicamentos crônicos.",
                responsavel);
        FornecedorModel servimed = fornecedor("Servimed Distribuidora", "04.392.160/0001-09",
                "Rua das Acácias, 1450 - Barueri/SP", "(11) 3030-5050", 4.6,
                "Distribuidora regional com foco em genéricos e medicamentos de uso contínuo.",
                responsavel);

        farmacia("Dose Segura Vila Mariana", "12.345.678/0001-90", "Rua Domingos de Morais, 1284 - São Paulo/SP",
                "(11) 3888-1020", 0.0, 90, eurofarma, responsavel);
        farmacia("Dose Segura Pinheiros", "12.345.678/0002-71", "Rua dos Pinheiros, 875 - São Paulo/SP",
                "(11) 3888-2030", 6.90, 120, eurofarma, responsavel);
        farmacia("Servimed Saúde Center", "98.765.432/0001-03", "Av. Eng. Luís Carlos Berrini, 1500 - Barueri/SP",
                "(11) 3030-6060", 0.0, 60, servimed, responsavel);

        medicamento("Losartana Potássica", "50mg", "Eurofarma", 18.90, 24.90, 25, 480, 900,
                "Anti-hipertensivo (ARA II). Uso contínuo.", "Losartana", "Cardiovascular", eurofarma);
        medicamento("Metformina", "850mg", "Eurofarma", 14.50, 19.90, 25, 360, 1200,
                "Antidiabético oral. Tomar com as refeições.", "Cloridrato de metformina", "Metabólico", eurofarma);
        medicamento(" AAS", "100mg", "Eurofarma", 9.80, 13.50, 25, 620, 1500,
                "Antiagregante plaquetário. Indicado para prevenção cardiovascular.", "Ácido acetilsalicílico", "Cardiovascular", eurofarma);
        medicamento("Omeprazol", "20mg", "Eurofarma", 22.40, 29.90, 25, 210, 700,
                "Inibidor de bomba de prótons. Uso antes das refeições.", "Omeprazol", "Digestivo", eurofarma);
        medicamento("Sinvastatina", "20mg", "Servimed", 16.20, 21.90, 20, 300, 640,
                "Redutor de colesterol. Tomar à noite.", "Sinvastatina", "Cardiovascular", servimed);
        medicamento("Levotiroxina", "75mcg", "Servimed", 27.90, 36.40, 20, 140, 420,
                "Tireoide. Uso em jejum, sempre no mesmo horário.", "Levotiroxina sódica", "Endócrino", servimed);
        medicamento("Colírio Lubrificante", "360ml", "Servimed", 32.50, 44.90, 25, 95, 500,
                "Uso tópico ocular. Indicado para olho seco.", "Hidroxietilcelulose", "Oftalmológico", servimed);
        medicamento("Vitamina D3", "2000UI", "Eurofarma", 39.90, 59.90, 30, 260, 1300,
                "Suplemento de manutenção. Tomar com refeição rica em gordura.", "Colecalciferol", "Suplementos", eurofarma);
        medicamento("Paracetamol", "750mg", "Eurofarma", 12.40, 17.90, 25, 880, 2000,
                "Analgésico e antitérmico. Uso eventual.", "Paracetamol", "Dor e febre", eurofarma);
        medicamento("Sertralina", "50mg", "Servimed", 45.00, 62.00, 20, 120, 380,
                "Antidepressivo. Manter o horário de uso.", "Cloridrato de sertralina", "Saúde mental", servimed);
    }

    private FornecedorModel fornecedor(String nome, String cnpj, String endereco, String telefone, double avaliacao,
                                      String descricao, PacienteModel responsavel) {
        FornecedorModel fornecedor = new FornecedorModel();
        fornecedor.setNomeFornecedor(nome);
        fornecedor.setCnpj(cnpj);
        fornecedor.setEndereco(endereco);
        fornecedor.setTelefone(telefone);
        fornecedor.setAvaliacao(avaliacao);
        fornecedor.setDescricao(descricao);
        fornecedor.setResponsavel(responsavel);
        return fornecedorRepo.save(fornecedor);
    }

    private void farmacia(String nome, String cnpj, String endereco, String telefone, double taxaEntrega,
                          int tempoMinutos, FornecedorModel fornecedor, PacienteModel responsavel) {
        FarmaciaModel farmacia = new FarmaciaModel();
        farmacia.setNomeUnidade(nome);
        farmacia.setCnpj(cnpj);
        farmacia.setEndereco(endereco);
        farmacia.setTelefone(telefone);
        farmacia.setTaxaEntrega(taxaEntrega);
        farmacia.setTempoEntregaMinutos(tempoMinutos);
        farmacia.setFornecedor(fornecedor);
        farmacia.setResponsavel(responsavel);
        farmaciaRepo.save(farmacia);
    }

    private void medicamento(String nome, String dosagem, String fabricante, double preco, double precoOriginal,
                             int desconto, int estoqueDisponivel, int estoqueFabricante, String descricao,
                             String principioAtivo, String categoria, FornecedorModel fornecedor) {
        MedicamentoModel medicamento = new MedicamentoModel();
        medicamento.setNome(nome);
        medicamento.setDosagem(dosagem);
        medicamento.setFabricante(fabricante);
        medicamento.setPreco(preco);
        medicamento.setPrecoOriginal(precoOriginal);
        medicamento.setDescontoPorcentagem(desconto);
        medicamento.setDescontoSelecionado(true);
        medicamento.setEstoqueDisponivel(estoqueDisponivel);
        medicamento.setEstoqueFabricante(estoqueFabricante);
        medicamento.setDescricao(descricao);
        medicamento.setPrincipioAtivo(principioAtivo);
        medicamento.setCategoria(categoria);
        medicamento.setFornecedor(fornecedor);
        medicamentoRepo.save(medicamento);
    }

    private void garantirRotina(PacienteModel paciente) {
        if (estoqueRepo.findAll().stream().anyMatch(item -> paciente.getId().equals(item.getPaciente().getId()))) {
            return;
        }
        List<Object[]> itens = List.of(
                new Object[]{"Losartana 50mg", 12, 1},
                new Object[]{"Metformina 850mg", 20, 2},
                new Object[]{"AAS 100mg", 5, 1});
        for (Object[] item : itens) {
            EstoquePacienteModel estoque = new EstoquePacienteModel();
            estoque.setPaciente(paciente);
            estoque.setNomeMedicamento((String) item[0]);
            estoque.setQuantidadeAtualComprimidos((Integer) item[1]);
            estoque.setConsumoDiarioComprimidos((Integer) item[2]);
            estoqueRepo.save(estoque);
        }

        LocalDateTime agora = LocalDateTime.now().withSecond(0).withNano(0);
        compromisso(paciente, "MEDICAMENTO", "Losartana 50mg", "1 comprimido", agora, 24,
                "Pressionar o comprimido com água, sem triturar.");
        compromisso(paciente, "MEDICAMENTO", "Metformina 850mg", "1 comprimido", agora.plusHours(2), 12,
                "Tomar com a refeição da tarde.");
        compromisso(paciente, "CONSULTA", "Consulta de acompanhamento", null, agora.plusDays(3), null,
                "Cardiologista - bring exams");
        compromisso(paciente, "EXAME", "Exame de sangue - glicemia", null, agora.plusDays(5), null,
                "Jejum de 8 horas.");
    }

    private void compromisso(PacienteModel paciente, String tipo, String titulo, String dosagem,
                             LocalDateTime inicio, Integer frequenciaHoras, String observacoes) {
        AgendaModel agenda = new AgendaModel();
        agenda.setPaciente(paciente);
        agenda.setTipo(tipo);
        agenda.setTitulo(titulo);
        agenda.setDosagem(dosagem);
        agenda.setHorarioInicio(inicio);
        agenda.setFrequenciaHoras(frequenciaHoras);
        agenda.setObservacoes(observacoes);
        agenda.setConcluido(false);
        agendaRepo.save(agenda);
    }
}
