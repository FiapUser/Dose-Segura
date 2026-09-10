package com.dosegura.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private Integer idade;

    @Column(columnDefinition = "TEXT")
    private String historicoMedico;

    private String alergias;

    @Column(columnDefinition = "TEXT")
    private String medicamentosEmUso;

    private String contatosEmergencia;

    @Column(columnDefinition = "TEXT")
    private String observacoesMedicas;

    @Column(unique = true)
    private String cpf;

    @Column(unique = true)
    private String cnpj;
}
