% ELEC8505 Assignment III, Problem 5.22
% Whitening of a zero-mean jointly Gaussian vector X = (X1, X2)'.
clear; close all;

N = 500;                          % number of realizations (100 <= N <= 1000)
K = [2 -1.5; -1.5 2];             % covariance matrix of X

% --- realizations of X ~ N(0,K):  X = L*W,  K = L*L',  W ~ N(0,I)
L = chol(K, 'lower');
X = L * randn(2, N);              % column k is the k-th realization (x1; x2)

% --- whitening transformation  Y = A*X  with  A = Lambda^(-1/2) * U'
[U, Lambda] = eig(K);             % K = U*Lambda*U', eigenvalues 0.5 and 3.5
A = diag(1 ./ sqrt(diag(Lambda))) * U';
Y = A * X;

% --- numerical check
disp('Whitening matrix A =');            disp(A);
disp('A*K*A'' (should be I) =');         disp(A*K*A');
disp('Sample covariance of X =');        disp(cov(X'));
disp('Sample covariance of Y =');        disp(cov(Y'));

% --- scatter diagrams
figure;
subplot(1,2,1);
plot(X(1,:), X(2,:), '.');
axis([-6 6 -6 6]); axis square; grid on;
xlabel('x_1'); ylabel('x_2'); title('Original variables');
subplot(1,2,2);
plot(Y(1,:), Y(2,:), '.');
axis([-6 6 -6 6]); axis square; grid on;
xlabel('y_1'); ylabel('y_2'); title('Whitened variables');
