package com.dosegura.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "fornecedores")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FornecedorModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nomeFornecedor;

    @Column(unique = true, nullable = false)
    private String cnpj;

    private String endereco;
    private String telefone;
    private Double avaliacao;

    @Column(length = 500)
    private String urlLogo;

    @Column(length = 200)
    private String urlLogoPublicId;

    @Column(length = 400)
    private String descricao;

    /**
     * Conta (CNPJ) dona do fornecedor. É ela que pode enviar o logo e as fotos
     * dos medicamentos deste fornecedor para o Cloudinary.
     */
    @ManyToOne
    @JoinColumn(name = "responsavel_id")
    @JsonIgnoreProperties({"senha", "cuidador", "responsavel"})
    private PacienteModel responsavel;

    /**
     * Unidades do fornecedor. EAGER para que a serialização funcione com
     * open-in-view desativado (a vitrine mostra as farmácias de cada parceiro).
     */
    @OneToMany(mappedBy = "fornecedor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("fornecedor")
    private List<FarmaciaModel> farmacias = new ArrayList<>();
}
