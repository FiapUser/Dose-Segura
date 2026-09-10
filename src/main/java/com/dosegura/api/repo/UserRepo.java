package com.dosegura.api.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.dosegura.api.model.UserModel;

@Repository
public interface UserRepo extends JpaRepository<UserModel, Long> {
}
