package com.dosegura.api.controller;

import com.dosegura.api.exception.DadosInvalidosException;
import com.dosegura.api.model.FarmaciaModel;
import com.dosegura.api.model.FornecedorModel;
import com.dosegura.api.model.ImagemUploadResponse;
import com.dosegura.api.model.MedicamentoModel;
import com.dosegura.api.model.PacienteModel;
import com.dosegura.api.model.TipoImagem;
import com.dosegura.api.repo.FarmaciaRepo;
import com.dosegura.api.repo.FornecedorRepo;
import com.dosegura.api.repo.MedicamentoRepo;
import com.dosegura.api.repo.Repo;
import com.dosegura.api.security.AutorizacaoService;
import com.dosegura.api.service.ImagemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Imagens da rede no Cloudinary.
 *
 * <p>Quem pode enviar o quê:</p>
 * <ul>
 *   <li>master admin: qualquer imagem da rede;</li>
 *   <li>conta de fornecedor (CNPJ): logo do fornecedor e fotos dos medicamentos dele;</li>
 *   <li>conta de farmácia (CNPJ): foto da unidade;</li>
 *   <li>paciente, familiar ou cuidador (CPF): somente a própria foto de perfil.</li>
 * </ul>
 */
@RestController
@RequestMapping("/dosegura/api/imagens")
public class ImagemController {

    @Autowired
    private ImagemService imagemService;

    @Autowired
    private AutorizacaoService autorizacao;

    @Autowired
    private Repo pacienteRepo;

    @Autowired
    private FornecedorRepo fornecedorRepo;

    @Autowired
    private FarmaciaRepo farmaciaRepo;

    @Autowired
    private MedicamentoRepo medicamentoRepo;

    /** Estado do Cloudinary (a UI usa para habilitar/desabilitar o upload). */
    @GetMapping("/config")
    public Map<String, Object> configuracao() {
        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("cloudinaryAtivo", imagemService.isCloudinaryAtivo());
        resposta.put("pastas", Map.of(
                "PERFIL", "perfis",
                "FORNECEDOR", "fornecedores",
                "FARMACIA", "farmacias",
                "MEDICAMENTO", "medicamentos"));
        return resposta;
    }

    /**
     * Envia uma imagem e devolve a URL do Cloudinary já gravada no registro.
     *
     * @param tipo  PERFIL, FORNECEDOR, FARMACIA ou MEDICAMENTO
     * @param id    id do registro (para PERFIL, o id do próprio paciente)
     * @param arquivo imagem (jpg, png, webp, gif, avif ou svg, até 5 MB)
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImagemUploadResponse enviar(
            @RequestParam("tipo") String tipo,
            @RequestParam(value = "id", required = false) Long id,
            @RequestParam(value = "nome", required = false) String nome,
            @RequestParam("arquivo") MultipartFile arquivo) {

        TipoImagem tipoImagem = TipoImagem.de(tipo);
        if (tipoImagem == null) {
            throw new DadosInvalidosException("Tipo de imagem inválido.");
        }
        autorizacao.exigirPermissaoDeImagem(tipoImagem, id);

        Map<String, Object> enviado = imagemService.enviar(arquivo, tipoImagem, id, nomeBase(tipoImagem, nome, id));
        ImagemUploadResponse resposta = ImagemUploadResponse.de(enviado, tipoImagem, id, true);

        switch (tipoImagem) {
            case PERFIL -> {
                PacienteModel paciente = pacienteRepo.findById(id).orElseThrow(() -> new DadosInvalidosException("Paciente não encontrado."));
                paciente.setFotoPerfil(resposta.url());
                paciente.setFotoPerfilPublicId(resposta.publicId());
                pacienteRepo.save(paciente);
            }
            case FORNECEDOR -> {
                FornecedorModel fornecedor = fornecedorRepo.findById(id).orElseThrow(() -> new DadosInvalidosException("Fornecedor não encontrado."));
                fornecedor.setUrlLogo(resposta.url());
                fornecedor.setUrlLogoPublicId(resposta.publicId());
                fornecedorRepo.save(fornecedor);
            }
            case FARMACIA -> {
                FarmaciaModel farmacia = farmaciaRepo.findById(id).orElseThrow(() -> new DadosInvalidosException("Farmácia não encontrada."));
                farmacia.setUrlImagem(resposta.url());
                farmacia.setUrlImagemPublicId(resposta.publicId());
                farmaciaRepo.save(farmacia);
            }
            case MEDICAMENTO -> {
                MedicamentoModel medicamento = medicamentoRepo.findById(id).orElseThrow(() -> new DadosInvalidosException("Medicamento não encontrado."));
                medicamento.setUrlImagem(resposta.url());
                medicamento.setUrlImagemPublicId(resposta.publicId());
                medicamentoRepo.save(medicamento);
            }
        }
        return resposta;
    }

    /** Remove a imagem do recurso e limpa o campo no banco. */
    @DeleteMapping("/{tipo}/{id}")
    public ResponseEntity<Void> remover(@PathVariable String tipo, @PathVariable Long id) {
        TipoImagem tipoImagem = TipoImagem.de(tipo);
        if (tipoImagem == null) {
            throw new DadosInvalidosException("Tipo de imagem inválido.");
        }
        autorizacao.exigirPermissaoDeImagem(tipoImagem, id);

        switch (tipoImagem) {
            case PERFIL -> {
                PacienteModel paciente = pacienteRepo.findById(id).orElseThrow(() -> new DadosInvalidosException("Paciente não encontrado."));
                imagemService.remover(paciente.getFotoPerfilPublicId());
                paciente.setFotoPerfil(null);
                paciente.setFotoPerfilPublicId(null);
                pacienteRepo.save(paciente);
            }
            case FORNECEDOR -> {
                FornecedorModel fornecedor = fornecedorRepo.findById(id).orElseThrow(() -> new DadosInvalidosException("Fornecedor não encontrado."));
                imagemService.remover(fornecedor.getUrlLogoPublicId());
                fornecedor.setUrlLogo(null);
                fornecedor.setUrlLogoPublicId(null);
                fornecedorRepo.save(fornecedor);
            }
            case FARMACIA -> {
                FarmaciaModel farmacia = farmaciaRepo.findById(id).orElseThrow(() -> new DadosInvalidosException("Farmácia não encontrada."));
                imagemService.remover(farmacia.getUrlImagemPublicId());
                farmacia.setUrlImagem(null);
                farmacia.setUrlImagemPublicId(null);
                farmaciaRepo.save(farmacia);
            }
            case MEDICAMENTO -> {
                MedicamentoModel medicamento = medicamentoRepo.findById(id).orElseThrow(() -> new DadosInvalidosException("Medicamento não encontrado."));
                imagemService.remover(medicamento.getUrlImagemPublicId());
                medicamento.setUrlImagem(null);
                medicamento.setUrlImagemPublicId(null);
                medicamentoRepo.save(medicamento);
            }
        }
        return ResponseEntity.noContent().build();
    }

    private String nomeBase(TipoImagem tipo, String nome, Long id) {
        if (nome != null && !nome.isBlank()) {
            return nome.trim();
        }
        return switch (tipo) {
            case PERFIL -> pacienteRepo.findById(id).map(PacienteModel::getNome).orElse("perfil");
            case FORNECEDOR -> fornecedorRepo.findById(id).map(FornecedorModel::getNomeFornecedor).orElse("fornecedor");
            case FARMACIA -> farmaciaRepo.findById(id).map(FarmaciaModel::getNomeUnidade).orElse("farmacia");
            case MEDICAMENTO -> medicamentoRepo.findById(id).map(MedicamentoModel::getNome).orElse("medicamento");
        };
    }
}
