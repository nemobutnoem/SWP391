package com.swp391.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

public class UserPrincipal implements UserDetails {
    private final Integer userId;
    private final String account;
    private final String role;
    
    public UserPrincipal(Integer userId, String account, String role) {
        this.userId = userId;
        this.account = account;
        this.role = role;
    }
    
    public Integer getUserId() {
        return userId;
    }
    
    public String getRole() {
        return role;
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return role != null ? List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase())) : List.of();
    }
    
    @Override
    public String getPassword() {
        return "";
    }
    
    @Override
    public String getUsername() {
        return account;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return true;
    }
}
