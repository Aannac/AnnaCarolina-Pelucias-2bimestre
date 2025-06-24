// Carrega dados do usuário
        document.addEventListener('DOMContentLoaded', function() {
            loadUserData();
            createFloatingHearts();
            setInterval(createFloatingHearts, 3000);
        });

        function loadUserData() {
            const userLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            
            if (userLogado) {
                document.getElementById('userName').textContent = userLogado.nome;
                document.getElementById('userEmail').textContent = userLogado.email;
                
                // Define avatar baseado na primeira letra do nome
                const firstLetter = userLogado.nome.charAt(0).toUpperCase();
                document.getElementById('userAvatar').textContent = firstLetter;
            } else {
                // Se não houver usuário logado, redireciona para login
                window.location.href = '../login/login.html';
            }
        }

        function logout() {
            if (confirm('Tem certeza que deseja sair da sua conta?')) {
                localStorage.removeItem('usuarioLogado');
                localStorage.removeItem('cupomDesconto');
                alert('Logout realizado com sucesso!');
                window.location.href = '../index.html';
            }
        }

        function removeFavorite(button) {
            const favoriteItem = button.closest('.favorite-item');
            const itemName = favoriteItem.querySelector('h4').textContent;
            
            if (confirm(`Remover "${itemName}" dos favoritos?`)) {
                favoriteItem.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    favoriteItem.remove();
                    
                    // Verifica se não há mais favoritos
                    const favoritesList = document.getElementById('favoritesList');
                    if (favoritesList.children.length === 0) {
                        favoritesList.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon">💔</div>
                                <p>Você ainda não tem favoritos.<br>Explore nossa loja e adicione suas pelúcias preferidas!</p>
                            </div>
                        `;
                    }
                }, 300);
            }
        }

        function createFloatingHearts() {
            const heartsContainer = document.getElementById('floatingHearts');
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.innerHTML = Math.random() > 0.5 ? '💖' : '🧸';
            heart.style.left = Math.random() * 100 + '%';
            heart.style.animationDelay = Math.random() * 2 + 's';
            heart.style.animationDuration = (Math.random() * 3 + 4) + 's';
            
            heartsContainer.appendChild(heart);
            
            // Remove o coração após a animação
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.parentNode.removeChild(heart);
                }
            }, 7000);
        }

        // Adiciona animação de fade out
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-20px); }
            }
        `;
        document.head.appendChild(style);