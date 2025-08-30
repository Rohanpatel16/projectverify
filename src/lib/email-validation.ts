// Email validation service with multiple API providers

export interface ValidationResult {
  email: string;
  isValid: boolean;
  score?: number;
  domain?: string;
  status?: string;
  hasMailbox?: boolean;
  isDisposable?: boolean;
  isFree?: boolean;
  isRole?: boolean;
  syntaxValid?: boolean;
  mxValid?: boolean;
  smtpValid?: boolean;
  suggestion?: string;
  error?: string;
  provider?: string;
  timestamp: string;
}

export interface ValidationSettings {
  provider: 'mslm' | 'email-checker' | 'automizely' | 'mail7' | 'validate-email' | 'bazzigate' | 'supersend' | 'site24x7';
  batchSize: number;
  timeout: number;
}

export class EmailValidationService {
  private static instance: EmailValidationService;
  private settings: ValidationSettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  static getInstance(): EmailValidationService {
    if (!EmailValidationService.instance) {
      EmailValidationService.instance = new EmailValidationService();
    }
    return EmailValidationService.instance;
  }

  private loadSettings(): ValidationSettings {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('emailValidationSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {
      provider: 'mslm',
      batchSize: 5,
      timeout: 30000
    };
  }

  saveSettings(settings: ValidationSettings): void {
    this.settings = settings;
    if (typeof window !== 'undefined') {
      localStorage.setItem('emailValidationSettings', JSON.stringify(settings));
    }
  }

  getSettings(): ValidationSettings {
    return { ...this.settings };
  }

  // MSLM.io API
  private async validateWithMslm(email: string): Promise<ValidationResult> {
    try {
      const response = await fetch(`https://mslm.io/api/sv/v1?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`MSLM API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        email: data.email,
        isValid: data.status === 'real',
        score: data.has_mailbox ? 95 : (data.status === 'real' ? 75 : 25),
        domain: data.domain,
        status: data.status,
        hasMailbox: data.has_mailbox,
        isDisposable: data.disposable,
        isFree: data.free,
        isRole: data.role,
        syntaxValid: !data.malformed,
        mxValid: data.mx && data.mx.length > 0,
        suggestion: data.suggestion || undefined,
        provider: 'mslm',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        email,
        isValid: false,
        error: error instanceof Error ? error.message : 'MSLM API error',
        provider: 'mslm',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Email-checker.space API
  private async validateWithEmailChecker(email: string): Promise<ValidationResult> {
    try {
      const response = await fetch(`https://email-checker.space/check_mailer.php?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Email-checker API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        email,
        isValid: data.success === 1,
        score: data.success === 1 ? 85 : 15,
        domain: email.split('@')[1],
        provider: 'email-checker',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        email,
        isValid: false,
        error: error instanceof Error ? error.message : 'Email-checker API error',
        provider: 'email-checker',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Automizely API
  private async validateWithAutomizely(email: string): Promise<ValidationResult> {
    try {
      const response = await fetch('https://websites.automizely.com/v1/public/email-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({ emails: [email] })
      });

      if (!response.ok) {
        throw new Error(`Automizely API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const result = data.data[0];
        return {
          email: result.email,
          isValid: result.syntax.valid && result.has_mx_records,
          score: result.reachable === 'unknown' ? 70 : (result.reachable === 'deliverable' ? 95 : 25),
          domain: result.syntax.domain,
          syntaxValid: result.syntax.valid,
          mxValid: result.has_mx_records,
          isDisposable: result.disposable,
          isRole: result.role_account,
          isFree: result.free,
          suggestion: result.suggestion || undefined,
          provider: 'automizely',
          timestamp: new Date().toISOString()
        };
      }

      throw new Error('No data returned from Automizely API');
    } catch (error) {
      return {
        email,
        isValid: false,
        error: error instanceof Error ? error.message : 'Automizely API error',
        provider: 'automizely',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Mail7.net API
  private async validateWithMail7(email: string): Promise<ValidationResult> {
    try {
      const response = await fetch('https://mail7.net/api/validate-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error(`Mail7 API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        email: data.email,
        isValid: data.valid,
        score: data.smtpValid ? 95 : (data.mxValid ? 75 : (data.formatValid ? 50 : 25)),
        domain: email.split('@')[1],
        syntaxValid: data.formatValid,
        mxValid: data.mxValid,
        smtpValid: data.smtpValid,
        error: data.error || undefined,
        provider: 'mail7',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        email,
        isValid: false,
        error: error instanceof Error ? error.message : 'Mail7 API error',
        provider: 'mail7',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Validate.email API
  private async validateWithValidateEmail(email: string): Promise<ValidationResult> {
    try {
      const response = await fetch(`https://api.validate.email/validate?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Validate.email API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        email: data.result.email,
        isValid: data.result.reachable === 'safe',
        score: data.result.riskScore ? Math.max(0, 100 - data.result.riskScore.score) : 50,
        domain: data.result.syntax.domain,
        status: data.result.reachable,
        hasMailbox: data.result.smtp.is_deliverable,
        isDisposable: data.result.disposable,
        syntaxValid: data.result.syntax.valid,
        mxValid: data.result.mx.accepts_mail,
        smtpValid: data.result.smtp.is_deliverable,
        error: data.result.reachable === 'invalid' ? 'Email not deliverable' : undefined,
        provider: 'validate-email',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        email,
        isValid: false,
        error: error instanceof Error ? error.message : 'Validate.email API error',
        provider: 'validate-email',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Bazzigate Email Verifiers API
  private async validateWithBazzigate(email: string): Promise<ValidationResult> {
    try {
      const response = await fetch(`https://emailverifiers-backend.bazzigate.com/single-email-varification?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Bazzigate API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        email: data.email,
        isValid: data.res,
        score: data.res ? 85 : 15,
        domain: email.split('@')[1],
        provider: 'bazzigate',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        email,
        isValid: false,
        error: error instanceof Error ? error.message : 'Bazzigate API error',
        provider: 'bazzigate',
        timestamp: new Date().toISOString()
      };
    }
  }

  // SuperSend API
  private async validateWithSuperSend(email: string): Promise<ValidationResult> {
    try {
      const response = await fetch(`https://api.supersend.io/v1/verify-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SuperSend API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        email: data.email,
        isValid: data.valid,
        score: data.valid ? 90 : 10,
        domain: email.split('@')[1],
        status: data.valid ? 'valid' : 'invalid',
        syntaxValid: data.valid_result.validators.regex.valid,
        mxValid: data.valid_result.validators.mx.valid,
        smtpValid: data.valid_result.validators.smtp.valid,
        error: !data.valid ? data.message : undefined,
        provider: 'supersend',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        email,
        isValid: false,
        error: error instanceof Error ? error.message : 'SuperSend API error',
        provider: 'supersend',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Site24x7 Email Validator API
  private async validateWithSite24x7(email: string): Promise<ValidationResult> {
    try {
      const formData = new URLSearchParams();
      formData.append('emails', email);

      const response = await fetch('https://www.site24x7.com/tools/email-validator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'accept': 'application/json'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Site24x7 API error: ${response.status}`);
      }

      const text = await response.text();
      // Decode HTML-encoded JSON response
      const decodedText = text.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      }).replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      
      const data = JSON.parse(decodedText);
      
      // Extract the first result
      const domain = Object.keys(data.results)[0];
      const emailResult = data.results[domain][email];
      
      return {
        email,
        isValid: emailResult.status === 250,
        score: emailResult.status === 250 ? 95 : 25,
        domain: domain,
        status: emailResult.status === 250 ? 'valid' : 'invalid',
        smtpValid: emailResult.status === 250,
        error: emailResult.status !== 250 ? emailResult.reason : undefined,
        provider: 'site24x7',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        email,
        isValid: false,
        error: error instanceof Error ? error.message : 'Site24x7 API error',
        provider: 'site24x7',
        timestamp: new Date().toISOString()
      };
    }
  }

  async validateEmail(email: string): Promise<ValidationResult> {
    switch (this.settings.provider) {
      case 'mslm':
        return await this.validateWithMslm(email);
      case 'email-checker':
        return await this.validateWithEmailChecker(email);
      case 'automizely':
        return await this.validateWithAutomizely(email);
      case 'mail7':
        return await this.validateWithMail7(email);
      case 'validate-email':
        return await this.validateWithValidateEmail(email);
      case 'bazzigate':
        return await this.validateWithBazzigate(email);
      case 'supersend':
        return await this.validateWithSuperSend(email);
      case 'site24x7':
        return await this.validateWithSite24x7(email);
      default:
        return await this.validateWithMslm(email);
    }
  }

  async validateBulkEmails(emails: string[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const batchSize = this.settings.batchSize;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(email => this.validateEmail(email));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        // If batch fails, try individual requests
        for (const email of batch) {
          try {
            const result = await this.validateEmail(email);
            results.push(result);
          } catch (singleError) {
            results.push({
              email,
              isValid: false,
              error: singleError instanceof Error ? singleError.message : 'Validation error',
              provider: this.settings.provider,
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}