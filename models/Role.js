const mongoose = require('mongoose')                                            // Makes the mongoose functions available.

const RoleSchema = new mongoose.Schema(
  {
    role: {                                                                   // This property is internal and manipulated by the reader.
      type: String,
      enum: ['chiefEditor', 'assistantEditor', 'associateEditor', 'reader'],           // Sets an array with possible values.
      default: 'reader',                                                       // Sets the default value.
    },
  },
)

module.exports = mongoose.model('Role', RoleSchema)