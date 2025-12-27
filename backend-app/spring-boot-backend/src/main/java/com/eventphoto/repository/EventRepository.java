package com.eventphoto.repository;

import com.eventphoto.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer> {
    @Query("SELECT e FROM Event e WHERE e.admin.id = :adminId")
    List<Event> findByAdminId(@Param("adminId") Integer adminId);

    List<Event> findByStatus(String status);

    @Query("SELECT e FROM Event e WHERE e.createdAt < :cutoff AND e.status = :status")
    List<Event> findByCreatedAtBeforeAndStatus(@Param("cutoff") LocalDateTime cutoff, @Param("status") String status);

    @Query("SELECT COUNT(e) FROM Event e WHERE e.admin.id = :adminId")
    long countByAdminId(@Param("adminId") Integer adminId);

    @Query("SELECT e FROM Event e JOIN e.photographers p WHERE p.id = :photographerId")
    List<Event> findByPhotographersId(@Param("photographerId") Integer photographerId);
}
