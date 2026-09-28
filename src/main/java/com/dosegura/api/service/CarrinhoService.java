package com.dosegura.api.service;

import com.dosegura.api.model.*;
import com.dosegura.api.repo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class CarrinhoService {

    @Autowired
    private CarrinhoRepo carrinhoRepo;

    @Autowired
    private ItemCarrinhoRepo itemCarrinhoRepo;

    @Autowired
    private MedicamentoRepo medicamentoRepo;

    @Autowired
    private Repo pacienteRepo;

    public CarrinhoModel obterPorPaciente(Long pacienteId) {
        return carrinhoRepo.findByPacienteId(pacienteId)
                .orElseGet(() -> {
                    PacienteModel paciente = pacienteRepo.findById(pacienteId)
                            .orElseThrow(() -> new RuntimeException("Paciente não encontrado"));
                    CarrinhoModel novoCarrinho = new CarrinhoModel();
                    novoCarrinho.setPaciente(paciente);
                    return carrinhoRepo.save(novoCarrinho);
                });
    }

    public CarrinhoModel adicionarItem(Long pacienteId, Long medicamentoId, Integer quantidade) {
        CarrinhoModel carrinho = obterPorPaciente(pacienteId);
        MedicamentoModel medicamento = medicamentoRepo.findById(medicamentoId)
                .orElseThrow(() -> new RuntimeException("Medicamento não encontrado"));

        if (medicamento.getEstoqueDisponivel() < quantidade) {
            throw new RuntimeException("Estoque insuficiente no fornecedor");
        }

        Optional<ItemCarrinhoModel> itemExistente = carrinho.getItens().stream()
                .filter(item -> item.getMedicamento().getId().equals(medicamentoId))
                .findFirst();

        if (itemExistente.isPresent()) {
            ItemCarrinhoModel item = itemExistente.get();
            item.setQuantidade(item.getQuantidade() + quantidade);
        } else {
            ItemCarrinhoModel novoItem = new ItemCarrinhoModel();
            novoItem.setCarrinho(carrinho);
            novoItem.setMedicamento(medicamento);
            novoItem.setQuantidade(quantidade);
            carrinho.getItens().add(novoItem);
        }

        return carrinhoRepo.save(carrinho);
    }

    public CarrinhoModel removerItem(Long pacienteId, Long itemId) {
        CarrinhoModel carrinho = obterPorPaciente(pacienteId);
        carrinho.getItens().removeIf(item -> item.getId().equals(itemId));
        return carrinhoRepo.save(carrinho);
    }

    public void finalizarCompra(Long pacienteId) {
        CarrinhoModel carrinho = obterPorPaciente(pacienteId);

        if (carrinho.getItens().isEmpty()) {
            throw new RuntimeException("Carrinho vazio");
        }

        for (ItemCarrinhoModel item : carrinho.getItens()) {
            MedicamentoModel med = item.getMedicamento();
            if (med.getEstoqueDisponivel() < item.getQuantidade()) {
                throw new RuntimeException("Estoque esgotado para o produto: " + med.getNome());
            }
            med.setEstoqueDisponivel(med.getEstoqueDisponivel() - item.getQuantidade());
            medicamentoRepo.save(med);
        }

        carrinho.getItens().clear();
        carrinhoRepo.save(carrinho);
    }
}
