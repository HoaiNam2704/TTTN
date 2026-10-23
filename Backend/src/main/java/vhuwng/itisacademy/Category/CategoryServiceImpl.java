package vhuwng.itisacademy.Category;

import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vhuwng.itisacademy.Category.dto.CategoryResponseDto;
import vhuwng.itisacademy.Category.dto.CreateCategoryRequestDto;
import vhuwng.itisacademy.Category.dto.UpdateCategoryRequestDto;
import vhuwng.itisacademy.Category.entity.Category;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final CategoryUtil categoryUtil;

    public CategoryServiceImpl(
            CategoryRepository categoryRepository,
            CategoryMapper categoryMapper,
            CategoryUtil categoryUtil) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
        this.categoryUtil = categoryUtil;
    }

    @Override
    public Page<CategoryResponseDto> getAllCategories(Pageable pageable) {
        Page<Category> categories = categoryRepository.findAll(pageable);
        Map<UUID, Long> courseCountByCategoryId = categoryUtil.countPublishedCoursesByCategoryIds(
                categories.getContent().stream().map(Category::getId).toList());

        return categories.map(category -> categoryMapper.toDto(
                category,
                courseCountByCategoryId.getOrDefault(category.getId(), 0L)));
    }

    @Override
    public CategoryResponseDto getCategoryById(UUID categoryId) {
        Category category = categoryUtil.findCategoryOrThrow(categoryId);
        return categoryMapper.toDto(category, categoryUtil.publishedCourseCount(categoryId));
    }

    @Override
    public CategoryResponseDto getCategoryBySlug(String slug) {
        Category category = categoryUtil.findBySlugOrThrow(slug);
        return categoryMapper.toDto(category, categoryUtil.publishedCourseCount(category.getId()));
    }

    @Override
    @Transactional
    public CategoryResponseDto createCategory(CreateCategoryRequestDto createCategoryRequestDto) {
        Category category = new Category();
        category.setName(createCategoryRequestDto.name());
        category.setSlug(categoryUtil.generateUniqueSlug(createCategoryRequestDto.name()));
        category.setDescription(createCategoryRequestDto.description());
        return categoryMapper.toDto(categoryRepository.save(category), 0L);
    }

    @Override
    @Transactional
    public CategoryResponseDto updateCategory(UUID categoryId, UpdateCategoryRequestDto updateCategoryRequestDto) {
        Category category = categoryUtil.findCategoryOrThrow(categoryId);
        if (updateCategoryRequestDto.name() != null) {
            category.setName(updateCategoryRequestDto.name());
            category.setSlug(categoryUtil.generateUniqueSlug(updateCategoryRequestDto.name()));
        }
        if (updateCategoryRequestDto.description() != null) {
            category.setDescription(updateCategoryRequestDto.description());
        }
        Category saved = categoryRepository.save(category);
        return categoryMapper.toDto(saved, categoryUtil.publishedCourseCount(saved.getId()));
    }

    @Override
    @Transactional
    public void deleteCategory(UUID categoryId) {
        Category category = categoryUtil.findCategoryOrThrow(categoryId);
        category.softDelete();
        categoryRepository.save(category);
    }
}
