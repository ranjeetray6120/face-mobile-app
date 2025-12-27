package com.eventphoto.repository;

import com.eventphoto.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, Integer> {
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Photo p WHERE p.event.id = :eventId")
    List<Photo> findByEventId(@Param("eventId") Integer eventId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Photo p WHERE p.event.id = :eventId AND p.indexed = :indexed")
    List<Photo> findByEventIdAndIndexed(@Param("eventId") Integer eventId, @Param("indexed") Boolean indexed);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM Photo p WHERE p.uploadedBy.id = :photographerId")
    long countByPhotographerId(@Param("photographerId") Integer photographerId);

    java.util.List<Photo> findByEventIdIn(java.util.List<Integer> eventIds);
}
