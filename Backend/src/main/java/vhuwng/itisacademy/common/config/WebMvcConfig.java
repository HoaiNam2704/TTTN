package vhuwng.itisacademy.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private static final String APPLICATION_PACKAGE = "vhuwng.itisacademy";

    @Override
    public void configurePathMatch(@NonNull PathMatchConfigurer configurer) {
        configurer.addPathPrefix(ApiConstants.BASE_PATH, handlerType ->
                handlerType.isAnnotationPresent(RestController.class)
                        && handlerType.getPackageName().startsWith(APPLICATION_PACKAGE));
    }
}
