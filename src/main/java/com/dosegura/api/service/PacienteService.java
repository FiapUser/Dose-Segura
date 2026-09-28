package com.dosegura.api.service;

import com.dosegura.api.exception.DadosInvalidosException;
import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.model.PerfilConta;
import com.dosegura.api.repo.Repo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class PacienteService {

    private static final Pattern HASH_BCRYPT = Pattern.compile("^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$");
    private static final int SENHA_MINIMO = 8;
    private static final int SENHA_MAXIMO = 72; // limite do BCrypt

    @Autowired
    private Repo pacienteRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ---------- Autenticação ----------

    public Optional<PacienteModel> login(String email, String senha) {
        if (email == null || senha == null || senha.length() > SENHA_MAXIMO) {
            return Optional.empty();
        }
        return pacienteRepo.findByEmail(email).filter(paciente -> senhaConfere(paciente, senha));
    }

    private boolean senhaConfere(PacienteModel paciente, String senhaInformada) {
        String armazenada = paciente.getSenha();
        if (armazenada == null) {
            return false;
        }
        if (HASH_BCRYPT.matcher(armazenada).matches()) {
            return passwordEncoder.matches(senhaInformada, armazenada);
        }

        // Conta antiga, com senha em texto puro: confere e converte para hash no primeiro login válido.
        boolean confere = MessageDigest.isEqual(
                armazenada.getBytes(StandardCharsets.UTF_8),
                senhaInformada.getBytes(StandardCharsets.UTF_8));
        if (confere) {
            paciente.setSenha(passwordEncoder.encode(senhaInformada));
            pacienteRepo.save(paciente);
        }
        return confere;
    }

    // ---------- Consultas ----------

    public Optional<PacienteModel> findById(Long id) {
        return pacienteRepo.findById(id);
    }

    public Optional<PacienteModel> findByEmail(String email) {
        return pacienteRepo.findByEmail(email);
    }

    public List<PacienteModel> findDependentes(Long cuidadorId) {
        return pacienteRepo.findByCuidadorId(cuidadorId);
    }

    // ---------- Escrita ----------

    /**
     * Cadastro público. Sempre cria um registro novo: ignora id e cuidador enviados pelo cliente
     * (um id existente faria o save sobrescrever a conta de outra pessoa).
     */
    public PacienteModel cadastrar(PacienteModel novo) {
        if (novo == null) {
            throw new DadosInvalidosException("Dados do paciente ausentes.");
        }
        validarEmail(novo.getEmail());
        validarSenhaNova(novo.getSenha());

        novo.setId(null);
        novo.setCuidador(null);
        novo.setEmail(novo.getEmail().trim());
        novo.setCpf(vazioParaNulo(novo.getCpf()));
        novo.setCnpj(vazioParaNulo(novo.getCnpj()));
        // Perfil derivado do documento: CPF -> pessoa física, CNPJ -> instituição.
        novo.setPerfil(PerfilConta.padrao(novo.getCnpj() != null).name());
        // Master admin só é concedido pela administração da plataforma.
        novo.setMasterAdmin(false);
        novo.setSenha(passwordEncoder.encode(novo.getSenha()));
        return pacienteRepo.save(novo);
    }

    /**
     * Uso interno (vínculo de cuidador). NÃO criptografa a senha: só deve receber entidades
     * lidas do banco. Cadastro e troca de senha passam por cadastrar e update.
     */
    public PacienteModel save(PacienteModel paciente) {
        return pacienteRepo.save(paciente);
    }

    /**
     * Atualização de dados. O próprio usuário pode alterar tudo (e-mail, CPF, CNPJ e senha);
     * o cuidador só altera os dados de saúde do dependente. O vínculo de cuidador nunca muda
     * por aqui, e a senha só muda quando é enviada (e então é criptografada).
     */
    public PacienteModel update(Long id, PacienteModel detalhes, boolean proprioUsuario) {
        PacienteModel paciente = pacienteRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Paciente não encontrado"));

        paciente.setNome(detalhes.getNome());
        paciente.setIdade(detalhes.getIdade());
        paciente.setHistoricoMedico(detalhes.getHistoricoMedico());
        paciente.setAlergias(detalhes.getAlergias());
        paciente.setMedicamentosEmUso(detalhes.getMedicamentosEmUso());
        paciente.setContatosEmergencia(detalhes.getContatosEmergencia());
        paciente.setObservacoesMedicas(detalhes.getObservacoesMedicas());

        if (proprioUsuario) {
            if (detalhes.getEmail() != null && !detalhes.getEmail().isBlank()) {
                validarEmail(detalhes.getEmail());
                paciente.setEmail(detalhes.getEmail().trim());
            }
            paciente.setCpf(vazioParaNulo(detalhes.getCpf()));
            paciente.setCnpj(vazioParaNulo(detalhes.getCnpj()));

            if (detalhes.getSenha() != null && !detalhes.getSenha().isBlank()) {
                validarSenhaNova(detalhes.getSenha());
                paciente.setSenha(passwordEncoder.encode(detalhes.getSenha()));
            }
        }

        return pacienteRepo.save(paciente);
    }

    public void delete(Long id) {
        pacienteRepo.deleteById(id);
    }

    // ---------- Utilidades ----------

    /** "maria.silva@exemplo.com" vira "m***@exemplo.com". */
    public static String mascararEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        int arroba = email.indexOf('@');
        String inicio = arroba > 0 ? email.substring(0, 1) : "";
        return inicio + "***" + email.substring(arroba);
    }

    private void validarEmail(String email) {
        if (email == null || email.isBlank() || !email.contains("@") || email.length() > 254) {
            throw new DadosInvalidosException("E-mail inválido.");
        }
    }

    private void validarSenhaNova(String senha) {
        if (senha == null || senha.length() < SENHA_MINIMO) {
            throw new DadosInvalidosException("A senha deve ter pelo menos " + SENHA_MINIMO + " caracteres.");
        }
        if (senha.length() > SENHA_MAXIMO) {
            throw new DadosInvalidosException("A senha deve ter no máximo " + SENHA_MAXIMO + " caracteres.");
        }
    }

    private String vazioParaNulo(String valor) {
        return (valor == null || valor.isBlank()) ? null : valor.trim();
    }
}
