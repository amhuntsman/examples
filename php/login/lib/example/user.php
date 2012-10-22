<?php
namespace Example;

/**
* Example\User
*
* Model class for a User object. In practice this would be subclassed from
* a more comprehensive ORM class.
*
* @author Aaron Huntsman <aaron.huntsman@gmail.com>
*/

class User {
  const DB_TABLE_NAME = 'user';
  const DB_PATH = '/../../db/example.sqlite3';
  
  /**
  * Primary integer key for the user.
  */
  public $id;
  
  /**
  * Username (public key)
  */
  public $username;
  
  /**
  * Blowfish-encrypted password (no storing unencrypted passwords!)
  */
  public $encrypted_password;
  
  private static $db;
  
  /**
  * Class constructor
  *
  * Sets parameters for a new user with either an array of parameters in
  * (id, username, encrypted_password) format, or provide each as a separate
  * function parameter.
  *
  * @param mixed $array_or_id An array or parameters or the integer ID
  * @param string $username The user's string username
  * @param string $e_pass The user's encrypted password
  */
  function __construct($array_or_id = null, $username = null, $e_pass = null) {
    if (is_array($array_or_id)) {
      list($this->id, $this->username, $this->encrypted_password) = $array_or_id;
    } else {
      $this->id = $array_or_id;
      $this->username = $username;
      $this->encrypted_password = $e_pass;
    }
  }
  
  /**
  * Fetch a User by ID
  *
  * Given a primary ID, will instantiate a new User object with
  * the given ID. Returns false if a user with the given ID does
  * not exist.
  *
  * @param integer $id Primary key ID for the user to be fetched
  * @return mixed An Example\User object, or false
  */
  public static function fetch($id) {
    self::connect_db();
    $result = self::db_query('SELECT * FROM ' . self::DB_TABLE_NAME .
      ' WHERE id=' . $id);
    return count($result) > 0 ? new self($result[0]) : false;    
  }

  /**
  * Fetch a User by username
  *
  * Given a username, will instantiate a new User object with
  * the given username. Returns false if a user with the given 
  * username does not exist.
  *
  * @param string $username Username for the user to be fetched
  * @return mixed An Example\User object, or false
  */  
  public static function fetch_by_username($username) {
    self::connect_db();
    $result = self::db_query('SELECT * FROM ' . self::DB_TABLE_NAME .
      ' WHERE username="' . $username . '"');
    return count($result) > 0 ? new self($result[0]) : false;
  }

  /**
  * Match a username and password
  *
  * Given a username and password, find a user with the given username,
  * and attempt to match the given password with the user's encrypted
  * password. Returns the matching User object if successful; false
  * otherwise.
  *
  * @param string $username Username for the user to attempt login with
  * @param string $password Password to match against given username
  * @return mixed An Example\User object, or false
  */  
  public static function login($username, $password) {
    $user = self::fetch_by_username($username);
    if (!$user) return false;
    $e_pass = $user->encrypted_password;
    return $e_pass == crypt($password, $e_pass) ? $user : false;
  }
  
  private static function connect_db() {
    try {
      if (!isset(self::$db)) {
        self::$db = new \SQLite3(self::db_path());
      }
    } catch (Exception $e) {
      // ...log errors here...
      exit("Could not open database");
    }
  }
  
  private static function db_path() {
    return __DIR__ . self::DB_PATH;
  }
  
  private static function db_query($query) {
    $result = array();
    $rs = self::$db->query($query);
    while ($row = $rs->fetchArray())
      $result[] = $row;
    return $result;
  }
}
?>