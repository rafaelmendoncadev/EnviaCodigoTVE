import { RetryConfig, ServiceError } from '../models/types.js';

export class RetryHandler {
  private static defaultConfig: RetryConfig = {
    max_attempts: 3,
    initial_delay: 1000, // 1 second
    max_delay: 10000, // 10 seconds
    exponential_base: 2
  };

  /**
   * Execute function with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    operationName: string = 'operation'
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= finalConfig.max_attempts; attempt++) {
      try {
        console.log(`[RetryHandler] Attempting ${operationName} - attempt ${attempt}/${finalConfig.max_attempts}`);
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`[RetryHandler] ${operationName} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error(`[RetryHandler] ${operationName} failed on attempt ${attempt}:`, {
          error: lastError.message,
          attempt,
          maxAttempts: finalConfig.max_attempts
        });

        // Don't retry if this is the last attempt
        if (attempt === finalConfig.max_attempts) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(lastError)) {
          console.log(`[RetryHandler] Error is not retryable for ${operationName}`);
          break;
        }

        // Calculate delay for next attempt
        const delay = Math.min(
          finalConfig.initial_delay * Math.pow(finalConfig.exponential_base, attempt - 1),
          finalConfig.max_delay
        );

        console.log(`[RetryHandler] Waiting ${delay}ms before retry for ${operationName}`);
        await this.sleep(delay);
      }
    }

    // If we get here, all attempts failed
    throw new Error(`${operationName} failed after ${finalConfig.max_attempts} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Check if error should trigger a retry
   */
  private static isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Network-related errors that are typically temporary
    const retryablePatterns = [
      'timeout',
      'connection',
      'network',
      'econnreset',
      'econnrefused',
      'socket hang up',
      '5xx', // Server errors
      'rate limit',
      'throttled',
      'service unavailable',
      'gateway timeout',
      'bad gateway'
    ];

    // Authentication errors should not be retried
    const nonRetryablePatterns = [
      'unauthorized',
      'forbidden',
      'invalid token',
      'authentication',
      'permission denied',
      'access denied',
      'bad request'
    ];

    // Check non-retryable patterns first
    for (const pattern of nonRetryablePatterns) {
      if (message.includes(pattern)) {
        return false;
      }
    }

    // Check retryable patterns
    for (const pattern of retryablePatterns) {
      if (message.includes(pattern)) {
        return true;
      }
    }

    // Default to retryable for unknown errors
    return true;
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create service error with retry information
   */
  static createServiceError(
    code: string,
    message: string,
    details?: any,
    retryPossible: boolean = true
  ): ServiceError {
    return {
      code,
      message,
      details,
      retry_possible: retryPossible,
      timestamp: new Date()
    };
  }

  /**
   * Execute with timeout
   */
  static async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string = 'operation'
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  /**
   * Execute with both retry and timeout
   */
  static async executeWithRetryAndTimeout<T>(
    operation: () => Promise<T>,
    retryConfig: Partial<RetryConfig> = {},
    timeoutMs: number = 30000,
    operationName: string = 'operation'
  ): Promise<T> {
    return this.executeWithRetry(
      () => this.executeWithTimeout(operation, timeoutMs, operationName),
      retryConfig,
      operationName
    );
  }

  /**
   * Create a circuit breaker for repeated failures
   */
  static createCircuitBreaker(
    failureThreshold: number = 5,
    recoveryTimeMs: number = 60000
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let isOpen = false;

    return {
      async execute<T>(operation: () => Promise<T>, operationName: string = 'operation'): Promise<T> {
        const now = Date.now();

        // Check if circuit breaker should reset
        if (isOpen && (now - lastFailureTime) > recoveryTimeMs) {
          isOpen = false;
          failures = 0;
          console.log(`[CircuitBreaker] Reset for ${operationName}`);
        }

        // If circuit is open, reject immediately
        if (isOpen) {
          throw new Error(`Circuit breaker is open for ${operationName}. Try again later.`);
        }

        try {
          const result = await operation();
          
          // Success - reset failure count
          if (failures > 0) {
            failures = 0;
            console.log(`[CircuitBreaker] Success after failures for ${operationName}`);
          }
          
          return result;
        } catch (error) {
          failures++;
          lastFailureTime = now;

          console.error(`[CircuitBreaker] Failure ${failures}/${failureThreshold} for ${operationName}`);

          // Open circuit if threshold reached
          if (failures >= failureThreshold) {
            isOpen = true;
            console.error(`[CircuitBreaker] Circuit opened for ${operationName}`);
          }

          throw error;
        }
      },

      getState() {
        return {
          isOpen,
          failures,
          lastFailureTime: lastFailureTime ? new Date(lastFailureTime) : null
        };
      }
    };
  }
}

// Global circuit breakers for different services
export const whatsappCircuitBreaker = RetryHandler.createCircuitBreaker(3, 30000);
export const emailCircuitBreaker = RetryHandler.createCircuitBreaker(3, 30000);