package com.dosegura.api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.dosegura.api.model.UserModel;
import com.dosegura.api.repo.UserRepo;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepo userRepo;

    public List<UserModel> findAll() {
        return userRepo.findAll();
    }

    public Optional<UserModel> findById(Long id) {
        return userRepo.findById(id);
    }

    public UserModel save(UserModel user) {
        return userRepo.save(user);
    }

    public UserModel update(Long id, UserModel userDetails) {
        return userRepo.findById(id).map(user -> {
            user.setNome(userDetails.getNome());
            user.setIdade(userDetails.getIdade());
            user.setHistoricoMedico(userDetails.getHistoricoMedico());
            user.setAlergias(userDetails.getAlergias());
            user.setMedicamentosEmUso(userDetails.getMedicamentosEmUso());
            user.setContatosEmergencia(userDetails.getContatosEmergencia());
            user.setObservacoesMedicas(userDetails.getObservacoesMedicas());
            user.setCpf(userDetails.getCpf());
            user.setCnpj(userDetails.getCnpj());
            return userRepo.save(user);
        }).orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    public void delete(Long id) {
        userRepo.deleteById(id);
    }
}
