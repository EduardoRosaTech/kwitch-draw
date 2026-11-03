begin;
insert into public.grimoires values
 ('familiar','O chamado do familiar','Conheça seu gato mágico em cinco pequenos rituais.','🐈‍⬛'),
 ('botanica','Herbário lunar','Cultive formas, texturas e um jardim impossível.','🌿'),
 ('feiticos','Ateliê dos feitiços','Transforme objetos comuns em pequenas histórias.','✧') on conflict do nothing;
insert into public.challenges(id,title,prompt,category,difficulty,duration_minutes,xp,grimoire_id,step) values
 (1,'Um gato entre as estrelas','Desenhe um gato preto dormindo dentro de uma lua crescente. Experimente três silhuetas antes de escolher sua favorita.','Personagens','iniciante',5,25,null,null),
 (2,'A xícara encantada','Imagine uma xícara que guarda uma floresta. Explore o contraste entre o pequeno recipiente e o mundo que vive nele.','Objetos','iniciante',5,25,null,null),
 (3,'Correio das bruxinhas','Crie uma carta entregue por uma mariposa. Inclua selo, envelope e um segredo visual.','Narrativa','intermediário',10,40,null,null),
 (4,'Lápis de constelações','Desenhe um lápis mágico que deixa pequenas estrelas no papel. Use apenas três cores.','Objetos','iniciante',5,25,null,null),
 (5,'Jardim de cogumelos','Crie três cogumelos com personalidades diferentes. Explore texturas nas copas.','Natureza','iniciante',5,25,null,null),
 (6,'Uma janela à meia-noite','Desenhe o ateliê de uma bruxa visto pela janela. Trabalhe luz quente e sombras frias.','Cenários','avançado',15,60,null,null),
 (7,'Poção de coragem','Invente um frasco para guardar coragem. Desenhe rótulo, tampa e o movimento do líquido.','Objetos','intermediário',10,40,null,null),
 (8,'O chapéu viajante','Desenhe um chapéu com bolsos que escondem mundos. Use linhas curvas e detalhes delicados.','Objetos','iniciante',5,25,null,null),
 (9,'Mapa de um sonho','Ilustre um mapa com três lugares mágicos conectados por um caminho improvável.','Cenários','intermediário',10,40,null,null),
 (10,'Retrato da ilustradora','Crie uma bruxinha ilustradora com seu lápis mágico. Explore uma pose que mostre sua personalidade.','Personagens','avançado',15,60,null,null),
 (11,'Asas de papel','Imagine uma borboleta feita de páginas de um livro antigo. Explore padrões simétricos.','Natureza','iniciante',5,25,null,null),
 (12,'Mercado da lua','Desenhe uma barraca de um mercado noturno que vende sonhos em pequenos potes.','Narrativa','avançado',15,60,null,null),
 (101,'A primeira silhueta','Desenhe cinco silhuetas de gato. Escolha uma para ser seu familiar.','Personagens','iniciante',5,25,'familiar',1),
 (102,'Olhos que contam histórias','Estude três expressões para o rosto do seu gato mágico.','Personagens','iniciante',5,25,'familiar',2),
 (103,'O familiar em movimento','Desenhe seu gato alongando, saltando e se enrolando.','Personagens','intermediário',10,40,'familiar',3),
 (104,'Um acessório encantado','Crie um amuleto especial para seu gato e detalhe sua textura.','Objetos','iniciante',5,25,'familiar',4),
 (105,'Retrato do familiar','Una seus estudos numa ilustração final do seu gato mágico.','Personagens','avançado',15,60,'familiar',5),
 (201,'Folhas da lua','Desenhe seis formas de folhas e combine duas numa planta imaginária.','Natureza','iniciante',5,25,'botanica',1),
 (202,'Flores impossíveis','Crie uma flor que floresce apenas à noite.','Natureza','iniciante',5,25,'botanica',2),
 (203,'Raízes secretas','Desenhe o que acontece sob a terra do seu jardim mágico.','Natureza','intermediário',10,40,'botanica',3),
 (204,'Um vaso com personalidade','Crie uma casa-vaso para sua planta e explore suas texturas.','Objetos','intermediário',10,40,'botanica',4),
 (205,'Página do herbário','Monte uma página ilustrada com sua planta, detalhes e notas à mão.','Natureza','avançado',15,60,'botanica',5),
 (301,'A chave encantada','Desenhe uma chave que abre uma porta para outro mundo.','Objetos','iniciante',5,25,'feiticos',1),
 (302,'O portal','Ilustre a porta que sua chave abre.','Cenários','intermediário',10,40,'feiticos',2),
 (303,'Um companheiro de viagem','Crie uma criatura pequena que conhece esse novo mundo.','Personagens','intermediário',10,40,'feiticos',3),
 (304,'Um lugar para descansar','Desenhe um abrigo mágico nesse mundo.','Cenários','intermediário',10,40,'feiticos',4),
 (305,'O retorno','Ilustre o momento em que sua viajante volta para casa com um presente.','Narrativa','avançado',15,60,'feiticos',5) on conflict do nothing;
insert into public.achievements values
 ('spark','Primeira faísca','Conclua seu primeiro ritual.','✧',1),
 ('pencil','Lápis desperto','Conclua cinco rituais.','✎',5),
 ('moon','Magia crescente','Conclua dez rituais.','☽',10),
 ('witch','Bruxa do ateliê','Conclua vinte e cinco rituais.','✦',25),
 ('master','Grão-feiticeira','Conclua cinquenta rituais.','♕',50) on conflict do nothing;
commit;
