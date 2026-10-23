package vhuwng.itisacademy.ratelimit;


import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    long capacity() default 10;
    long refillTokens() default 5;
    long refillDurationSeconds() default 60;
}