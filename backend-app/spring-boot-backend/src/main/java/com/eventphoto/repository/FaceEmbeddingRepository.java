package com.eventphoto.repository;

import com.eventphoto.entity.FaceEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FaceEmbeddingRepository extends JpaRepository<FaceEmbedding, Integer> {
    Optional<FaceEmbedding> findByPhotoId(Integer photoId);
}
