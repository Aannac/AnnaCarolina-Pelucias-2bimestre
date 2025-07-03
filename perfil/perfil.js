// Carrega dados do usuário
        document.addEventListener('DOMContentLoaded', function() {
            loadUserData();
            loadUserFavorites();
            createFloatingHearts();
            setInterval(createFloatingHearts, 3000);
        });

        function loadUserData() {
            const userLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            
            if (userLogado) {
                document.getElementById('userName').textContent = userLogado.nome;
                document.getElementById('userEmail').textContent = userLogado.email;
                
                // Mostra o tipo de usuário
                const userType = userLogado.tipo || 'cliente';
                document.getElementById('userType').textContent = `Tipo: ${userType.charAt(0).toUpperCase() + userType.slice(1)}`;
                
                // Se for gerente, mostra as ações de gerente
                if (userType === 'gerente') {
                    document.getElementById('managerActions').style.display = 'block';
                }
                
                // Define avatar baseado na primeira letra do nome
                const firstLetter = userLogado.nome.charAt(0).toUpperCase();
                document.getElementById('userAvatar').textContent = firstLetter;
            } else {
                // Se não houver usuário logado, redireciona para login
                window.location.href = '../login/login.html';
            }
        }

        // Função para carregar favoritos do usuário
        async function loadUserFavorites() {
            const userLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            
            if (!userLogado || !userLogado.email) {
                return;
            }

            try {
                // Buscar favoritos do usuário
                const favoritesRes = await fetch(`/api/favorites/${userLogado.email}`);
                const favoritesData = await favoritesRes.json();
                const favoriteProducts = favoritesData.favorites || [];

                displayFavorites(favoriteProducts);
            } catch (error) {
                console.error('Erro ao carregar favoritos:', error);
                displayEmptyFavorites();
            }
        }

        // Função para exibir favoritos
        function displayFavorites(favoriteProducts) {
            const favoritesList = document.getElementById('favoritesList');
            
            if (favoriteProducts.length === 0) {
                displayEmptyFavorites();
                return;
            }

            favoritesList.innerHTML = '';
            
            favoriteProducts.forEach(product => {
                const favoriteItem = document.createElement('div');
                favoriteItem.className = 'favorite-item';
                favoriteItem.innerHTML = `
                    <div class="favorite-img">
                        <img src="/imagem/${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                    </div>
                    <div class="favorite-details">
                        <h4>${product.name}</h4>
                        <p>R$ ${product.price.toFixed(2)}</p>
                    </div>
                    <button class="remove-favorite" onclick="removeFavoriteProduct(${product.id}, this)" title="Remover dos favoritos">×</button>
                `;
                favoritesList.appendChild(favoriteItem);
            });
        }

        // Função para exibir estado vazio
        function displayEmptyFavorites() {
            const favoritesList = document.getElementById('favoritesList');
            favoritesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💔</div>
                    <p>Você ainda não tem favoritos.<br>Explore nossa loja e adicione suas pelúcias preferidas!</p>
                    <a href="../Index.html" class="empty-state-btn">Ir para a Loja</a>
                </div>
            `;
        }

        function logout() {
            if (confirm('Tem certeza que deseja sair da sua conta?')) {
                localStorage.removeItem('usuarioLogado');
                localStorage.removeItem('cupomDesconto');
                alert('Logout realizado com sucesso!');
                window.location.href = '../Index.html';
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
        // Função para remover produto dos favoritos
        async function removeFavoriteProduct(productId, button) {
            const userLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            
            if (!userLogado || !userLogado.email) {
                alert('Erro: usuário não encontrado.');
                return;
            }

            const favoriteItem = button.closest('.favorite-item');
            const itemName = favoriteItem.querySelector('h4').textContent;
            
            if (!confirm(`Remover "${itemName}" dos favoritos?`)) {
                return;
            }

            try {
                const response = await fetch('/api/favorites/remove', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: userLogado.email,
                        produto_id: productId
                    })
                });

                const data = await response.json();
                
                if (response.ok) {
                    // Animação de remoção
                    favoriteItem.style.animation = 'fadeOut 0.3s ease-out';
                    setTimeout(() => {
                        favoriteItem.remove();
                        
                        // Verifica se não há mais favoritos
                        const favoritesList = document.getElementById('favoritesList');
                        if (favoritesList.children.length === 0) {
                            displayEmptyFavorites();
                        }
                    }, 300);
                    
                    showNotification('Produto removido dos favoritos!');
                } else {
                    alert('Erro ao remover favorito: ' + (data.error || data.message));
                }
            } catch (error) {
                console.error('Erro ao remover favorito:', error);
                alert('Erro ao remover favorito. Tente novamente.');
            }
        }

        // Função para mostrar notificação
        function showNotification(message) {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                z-index: 1000;
                font-weight: bold;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }

