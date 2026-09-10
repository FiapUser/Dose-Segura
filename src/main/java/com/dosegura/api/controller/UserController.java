package com.dosegura.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.dosegura.api.model.UserModel;
import com.dosegura.api.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/dosegura/api/")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/user")
    public List<UserModel> getAllUsers() {
        return userService.findAll();
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<UserModel> getUserById(@PathVariable Long id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/user")
    public UserModel createUser(@RequestBody UserModel user) {
        return userService.save(user);
    }

    @PutMapping("/user/{id}")
    public ResponseEntity<UserModel> updateUser(@PathVariable Long id, @RequestBody UserModel userDetails) {
        try {
            return ResponseEntity.ok(userService.update(id, userDetails));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/user/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
