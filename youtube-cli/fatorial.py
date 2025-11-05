def fatorial(n):
    """
    Calcula o fatorial de um número inteiro não negativo.
    
    Args:
        n (int): Número inteiro não negativo
        
    Returns:
        int: O fatorial de n
        
    Raises:
        ValueError: Se n for negativo
        TypeError: Se n não for inteiro
    """
    if not isinstance(n, int):
        raise TypeError("O argumento deve ser um número inteiro")
    
    if n < 0:
        raise ValueError("O fatorial não está definido para números negativos")
    
    if n == 0 or n == 1:
        return 1
    
    resultado = 1
    for i in range(2, n + 1):
        resultado *= i
    
    return resultado

# Exemplo de uso:
# print(fatorial(5))  # Saída: 120
# print(fatorial(0))  # Saída: 1
# print(fatorial(1))  # Saída: 1