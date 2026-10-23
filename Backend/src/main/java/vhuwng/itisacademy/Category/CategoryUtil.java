package vhuwng.itisacademy.Category;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import vhuwng.itisacademy.Category.entity.Category;
import vhuwng.itisacademy.Course.CourseRepository;
import vhuwng.itisacademy.common.enums.CourseStatus;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Component
public class CategoryUtil {
    private final CategoryRepository categoryRepository;
    private final CourseRepository courseRepository;

    public CategoryUtil(CategoryRepository categoryRepository, CourseRepository courseRepository) {
        this.categoryRepository = categoryRepository;
        this.courseRepository = courseRepository;
    }

    public Category findCategoryOrThrow(UUID categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    public Category findBySlugOrThrow(String slug) {
        return categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with slug " + slug));
    }

    public long publishedCourseCount(UUID categoryId) {
        return courseRepository.countByCategoryIdAndStatus(categoryId, CourseStatus.PUBLISHED);
    }

    public Map<UUID, Long> countPublishedCoursesByCategoryIds(List<UUID> categoryIds) {
        Map<UUID, Long> courseCountByCategoryId = new HashMap<>();
        if (categoryIds.isEmpty()) {
            return courseCountByCategoryId;
        }
        for (Object[] row : courseRepository.countGroupedByCategoryIdsAndStatus(
                categoryIds, CourseStatus.PUBLISHED)) {
            courseCountByCategoryId.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return courseCountByCategoryId;
    }

    public String generateUniqueSlug(String name) {
        String base = slugify(name);
        String slug = base;
        int suffix = 1;

        while (categoryRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }

        return slug;
    }

    private String slugify(String title) {
        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        return normalized.isBlank() ? "category" : normalized;
    }
}
