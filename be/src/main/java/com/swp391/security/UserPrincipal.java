package com.swp391.security;

<<<<<<< HEAD
<<<<<<< HEAD
import com.swp391.user.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@RequiredArgsConstructor
public class UserPrincipal implements UserDetails {
	private final UserEntity user;

	public Integer getUserId() {
		return user.getId();
	}

	public String getRole() {
		return user.getRole();
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		String role = user.getRole() == null ? "" : user.getRole();
		return List.of(new SimpleGrantedAuthority("ROLE_" + role));
	}

	@Override
	public String getPassword() {
		return user.getPasswordHash();
	}

	@Override
	public String getUsername() {
		return user.getAccount();
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
		return user.getStatus() == null || !user.getStatus().equalsIgnoreCase("inactive");
	}
=======
=======
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
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
<<<<<<< HEAD
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
=======
>>>>>>> eb6e5285c66ffe32ec0db019fe1680dd33dd99ca
}
