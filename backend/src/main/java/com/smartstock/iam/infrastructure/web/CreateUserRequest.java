package com.smartstock.iam.infrastructure.web;

public record CreateUserRequest(String username, String password, String displayName, String role) {
}
