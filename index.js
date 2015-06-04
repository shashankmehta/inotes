var sqlite3  = require('sqlite3').verbose();
var fs       = require('fs');
var chalk    = require('chalk');
var userHome = require('user-home');

const RESULT_DIRECTORY_NAME = "iBooks exports for Evernote";
const BOOKS_DIR = userHome + '/Library/Containers/com.apple.iBooksX/Data/Documents/BKLibrary';
const NOTES_DIR = userHome + '/Library/Containers/com.apple.iBooksX/Data/Documents/AEAnnotation'

var colors = {
  ok: function(){
    for(var i in arguments){
      console.log(chalk.green(arguments[i]));
    }
  },
  error: function(){
    for(var i in arguments){
      console.log(chalk.red(arguments[i]));
    }
  }
}

var system = {
  booksDB: null,
  notesDB: null,

  _checkDirExists: function(dir){
    if(!fs.existsSync(dir)) {
      return false;
    }
    else return true;
  },

  _getSQLiteFile: function(dir){
    var files = fs.readdirSync(dir);
    for(var i in files){
      if(files[i].substr(-6) === 'sqlite')
        return dir + '/' + files[i];
    }
    return null;
  },

  _verifyDB: function(){
    if(this.booksDB === null){
      colors.error("The Book Database doesn't seem to exist.");
      proc.exitWithError();
    }

    if(this.notesDB === null){
      colors.error("The notes database doesn't seem to exist.");
      proc.exitWithError();
    }
  },

  getDBNames: function(){
    if(this._checkDirExists(BOOKS_DIR) === true){
      system.booksDB = this._getSQLiteFile(BOOKS_DIR);
    }

    if(this._checkDirExists(NOTES_DIR) === true){
      system.notesDB = this._getSQLiteFile(NOTES_DIR);
    }
    this._verifyDB();
  }
}

var sql = {
  _dbBooks: null,
  _dbNotes: null,
  books: [],
  notes: [],
  _loaded: 0,

  init: function(){
    this._dbBooks = new sqlite3.Database(system.booksDB);
    this._dbNotes = new sqlite3.Database(system.notesDB);
  },

  getBooks: function(callback){
    var self = this;
    var db = this._dbBooks;
    db.serialize(function(){
      var query = "SELECT ZASSETID as id, ZTITLE AS title, ZAUTHOR AS author FROM ZBKLIBRARYASSET WHERE ZTITLE IS NOT NULL";
      db.each(query, function(err, row) {
        if(err){
          colors.error(err);
          proc.exitWithError();
        }

        self.books[row['id']] = row;
      }, function(){
        if(typeof callback === 'function'){
          callback('books');
        }
      });
    })
  },

  getNotes: function(callback){
    var self = this;
    var db = this._dbNotes;
    db.serialize(function(){
      var query = "SELECT\
          Z_PK as id,\
          ZANNOTATIONREPRESENTATIVETEXT as fullText,\
          ZANNOTATIONSELECTEDTEXT as note,\
          ZFUTUREPROOFING5 as Chapter,\
          ZANNOTATIONCREATIONDATE as Created,\
          ZANNOTATIONMODIFICATIONDATE as Modified,\
          ZANNOTATIONASSETID as bookID\
        FROM ZAEANNOTATION\
        WHERE ZANNOTATIONSELECTEDTEXT IS NOT NULL\
        ORDER BY ZANNOTATIONASSETID ASC,Created ASC";
      db.each(query, function(err, row) {
        if(err){
          colors.error(err);
          proc.exitWithError();
        }

        self.notes[row['id']] = row;
      }, function(){
        if(typeof callback === 'function'){
          callback('notes');
        }
      });

    })
  },

  collateNotes: function(){
    var notes = this.notes;
    var books = this.books;
    for(var i in notes){
      var note = notes[i];
      if(typeof books[note.bookID] === 'undefined'){
        console.log('missing book');
        continue;
      }

      if(typeof books[note.bookID].notes !== 'object'){
        books[note.bookID].notes = [];
      }

      books[note.bookID].notes.push(note);
    }
  },

  close: function(){
    this._dbBooks.close();
    this._dbNotes.close();
  },

  loaded: function(type){
    sql._loaded++;

    if(sql._loaded === 2){
      colors.ok('OK');
      sql.collateNotes();
    }
  }
}

var proc = {
  exit: function(){
    process.exit(0);
  },

  exitWithError: function(){
    process.exit(1);
  }
}

var exec = function(){
  chalk.green('asd');
  system.getDBNames();
  sql.init();
  sql.getBooks(sql.loaded);
  sql.getNotes(sql.loaded);
}

exec();
