package vhuwng.itisacademy.Topic;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import vhuwng.itisacademy.Topic.entity.Topic;

public interface TopicRepository extends JpaRepository<Topic, UUID>, JpaSpecificationExecutor<Topic> {

    Optional<Topic> findByNameIgnoreCase(String name);
}
