package vhuwng.itisacademy.Quiz;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vhuwng.itisacademy.Quiz.entity.Quiz;

public interface QuizRepository extends JpaRepository<Quiz, UUID>, JpaSpecificationExecutor<Quiz> {

    Page<Quiz> findByTopicId(UUID topicId, Pageable pageable);

    List<Quiz> findByTopicId(UUID topicId);

    long countByTopicId(UUID topicId);

    @Query("""
            SELECT q.topic.id, COUNT(q)
            FROM Quiz q
            WHERE q.topic.id IN :topicIds
            GROUP BY q.topic.id
            """)
    List<Object[]> countGroupedByTopicIds(@Param("topicIds") Collection<UUID> topicIds);
}
