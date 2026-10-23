package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "events_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventMaster {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "event_type", nullable = false)
    private String eventType; // 'singles', 'doubles'

    @Column(nullable = false)
    private String category; // 'junior', 'open', 'veteran'

    @Column(nullable = false)
    private String gender; // 'Male', 'Female', 'Mixed', 'Open'

    @Column(name = "min_age")
    private Integer minAge;

    @Column(name = "max_age")
    private Integer maxAge;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
