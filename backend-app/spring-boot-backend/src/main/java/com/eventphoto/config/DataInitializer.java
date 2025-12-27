package com.eventphoto.config;

import com.eventphoto.entity.Role;
import com.eventphoto.entity.User;
import com.eventphoto.repository.RoleRepository;
import com.eventphoto.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Initialize Roles
        for (Role.RoleType roleType : Role.RoleType.values()) {
            if (!roleRepository.findByName(roleType.name()).isPresent()) {
                Role role = new Role();
                role.setName(roleType.name());
                roleRepository.save(role);
            }
        }

        // Initialize Super Admin if not exists
        if (!userRepository.existsByEmail("admin@eventphoto.com")) {
            Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
            User admin = new User();
            admin.setName("Default Admin");
            admin.setEmail("admin@eventphoto.com");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole(adminRole);
            admin.setStatus("ACTIVE");
            userRepository.save(admin);
        }

        // Initialize Photographer if not exists
        if (!userRepository.existsByEmail("photographer@eventphoto.com")) {
            Role photoRole = roleRepository.findByName("PHOTOGRAPHER").orElseThrow();
            User photographer = new User();
            photographer.setName("Default Photographer");
            photographer.setEmail("photographer@eventphoto.com");
            photographer.setPasswordHash(passwordEncoder.encode("photo123"));
            photographer.setRole(photoRole);
            photographer.setStatus("ACTIVE");
            userRepository.save(photographer);
        }
    }
}
