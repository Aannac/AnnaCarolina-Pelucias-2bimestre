// Funcionalidade para mostrar/ocultar senha
document.addEventListener('DOMContentLoaded', function() {
    const eyeIcons = document.querySelectorAll('.fa-eye');
    
    eyeIcons.forEach(function(eyeIcon) {
        eyeIcon.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('input[type="password"], input[type="text"]');
            
            if (passwordInput.getAttribute('type') === 'password') {
                passwordInput.setAttribute('type', 'text');
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                passwordInput.setAttribute('type', 'password');
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });
});

const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

function voltar() {
    window.location.href = '../Index.html'
}

signUpButton.addEventListener('click', () => {
    container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
    container.classList.remove("right-panel-active");
});


function toggleMobile() {
    const signInPanel = document.querySelector('.sign-in-panel');
    const signUpPanel = document.querySelector('.sign-up-panel');

    if (window.innerWidth <= 768) {
        if (signInPanel.style.display === 'none') {
            signInPanel.style.display = 'flex';
            signUpPanel.style.display = 'none';
        } else {
            signInPanel.style.display = 'none';
            signUpPanel.style.display = 'flex';
        }
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.style.display = 'none';
}

function showSuccess(elementId, message) {
    const successElement = document.getElementById(elementId);
    successElement.textContent = message;
    successElement.style.display = 'block';
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 3000);
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    hideError('loginEmailError');
    hideError('loginPasswordError');

    let isValid = true;

    if (!validateEmail(email)) {
        showError('loginEmailError', 'Por favor, insira um email válido');
        isValid = false;
    }

    if (!validatePassword(password)) {
        showError('loginPasswordError', 'A senha deve ter pelo menos 6 caracteres');
        isValid = false;
    }

    if (isValid) {
        fetch('/api/cadastrar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, password })
        })
        .then(res => res.json())
        .then(data => {
          if (data.message) {
            showSuccess('signupSuccess', 'Conta criada com sucesso! Redirecionando...');
            signupForm.reset();
            setTimeout(() => {
              if (window.innerWidth <= 768) {
                toggleMobile();
              } else {
                container.classList.remove("right-panel-active");
              }
            }, 2000);
          }
        })
        .catch(err => {
          console.error('Erro ao cadastrar:', err);
          showError('emailError', 'Erro ao cadastrar. Tente novamente.');
        });
      }
      
    })
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    hideError('nameError');
    hideError('emailError');
    hideError('passwordError');
    hideError('confirmPasswordError');

    let isValid = true;

    if (name.length < 2) {
        showError('nameError', 'Nome deve ter pelo menos 2 caracteres');
        isValid = false;
    }

    if (!validateEmail(email)) {
        showError('emailError', 'Por favor, insira um email válido');
        isValid = false;
    }

    if (users.find(u => u.email === email)) {
        showError('emailError', 'Este email já está cadastrado');
        isValid = false;
    }

    if (!validatePassword(password)) {
        showError('passwordError', 'A senha deve ter pelo menos 6 caracteres');
        isValid = false;
    }

    if (password !== confirmPassword) {
        showError('confirmPasswordError', 'As senhas não coincidem');
        isValid = false;
    }

    if (!agreeTerms) {
        showError('confirmPasswordError', 'Você deve aceitar os termos e condições');
        isValid = false;
    }

    if (isValid) {
        users.push({ name, email, password });
        showSuccess('signupSuccess', 'Conta criada com sucesso! Redirecionando...');
        signupForm.reset();
        setTimeout(() => {
            if (window.innerWidth <= 768) {
                toggleMobile();
            } else {
                container.classList.remove("right-panel-active");
            }
        }, 2000);
    }
});

window.addEventListener('load', () => {
    document.body.classList.add('fade-in');
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        document.querySelector('.sign-in-panel').style.display = 'flex';
        document.querySelector('.sign-up-panel').style.display = 'flex';
    }
});

if (window.innerWidth <= 768) {
    document.querySelector('.sign-up-panel').style.display = 'none';
}
