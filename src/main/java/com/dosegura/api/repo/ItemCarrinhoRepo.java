package com.dosegura.api.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.dosegura.api.model.ItemCarrinhoModel;

@Repository
public interface ItemCarrinhoRepo extends JpaRepository<ItemCarrinhoModel, Long> {
}
