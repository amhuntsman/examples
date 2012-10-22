<?php
namespace Example;

/**
* Example\Crypto
*
* Encapsulates encryption functions used for user passwords. All classes
* in this 
*
* @author Aaron Huntsman <aaron.huntsman@gmail.com>
*/
class Crypto {
  
  /**
  * Salt prefix
  *
  * Direct the PHP crypt() function to use the Blowfish algorithm over 2^8
  * iterations.
  */
  const SALT_PREFIX = '$2y$08$';
  
  /**
  * Valid characters for Blowfish salt string
  */
  const SALT_ALPHABET = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  
  /**
  * Length of salt string to be randomly generated
  */ 
  const SALT_LENGTH = 22;
  
  /**
  * Encrypt a string using a random salt
  *
  * @param string $string The string to be encrypted
  * @return string The encrypted string
  */
  public static function encrypt($string) {
    return crypt($string, self::generate_salt());
  }
  
  /**
  * Generate random salt string prepended with appropriate crypt() prefix
  *
  * @return string Random salt string
  */
  public static function generate_salt() {
    return self::SALT_PREFIX . self::random_salt_string();
  }
  
  /**
  *
  * @param string $password
  * @param string $encrypted_password
  * @return boolean
  */
  public static function is_match($password, $encrypted_password) {
    return $encrypted_password = crypt($password, $encrypted_password);
  }
  
  private static function random_salt_string() {
    $result = ''; $salt_alphabet_length = strlen(self::SALT_ALPHABET) - 1;
    for ($i = 0; $i < self::SALT_LENGTH; $i++)
      $result .= substr(self::SALT_ALPHABET, mt_rand(0, $salt_alphabet_length), 1);
    return $result;
  }
}
?>