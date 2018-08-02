/*******************************************************************************
**
** Advanced Distributed Learning Co-Laboratory (ADL Co-Lab) grants you
** ("Licensee") a non-exclusive, royalty free, license to use and redistribute
** this software in source and binary code form, provided that i) this copyright
** notice and license appear on all copies of the software; and ii) Licensee
** does not utilize the software in a manner which is disparaging to ADL Co-Lab.
**
** This software is provided "AS IS," without a warranty of any kind.  ALL
** EXPRESS OR IMPLIED CONDITIONS, REPRESENTATIONS AND WARRANTIES, INCLUDING ANY
** IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR
** NON-INFRINGEMENT, ARE HEREBY EXCLUDED.  ADL Co-Lab AND ITS LICENSORS SHALL
** NOT BE LIABLE FOR ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING,
** MODIFYING OR DISTRIBUTING THE SOFTWARE OR ITS DERIVATIVES.  IN NO EVENT WILL
** ADL Co-Lab OR ITS LICENSORS BE LIABLE FOR ANY LOST REVENUE, PROFIT OR DATA,
** OR FOR DIRECT, INDIRECT, SPECIAL, CONSEQUENTIAL, INCIDENTAL OR PUNITIVE
** DAMAGES, HOWEVER CAUSED AND REGARDLESS OF THE THEORY OF LIABILITY, ARISING
** OUT OF THE USE OF OR INABILITY TO USE SOFTWARE, EVEN IF ADL Co-Lab HAS BEEN
** ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
**
*******************************************************************************/

/*******************************************************************************
**
** This file is being presented to Content Developers, Content Programmers and
** Instructional Designers to demonstrate one way to abstract API calls from the
** actual content to allow for uniformity and reuse of content fragments.
**
** The purpose in wrapping the calls to the API is to (1) provide a
** consistent means of finding the LMS API adapter within the window
** hierarchy, (2) to ensure that the method calls are called correctly by the
** SCO and (3) to make possible changes to the actual API Specifications and
** Standards easier to implement/change quickly.
**
** This is just one possible example for implementing the API guidelines for
** runtime communication between an LMS and executable content components.
** There are many other possible implementations.
**
*******************************************************************************/
var scoreDetail = {
    scorePercent:0,
    apiRef:null
};

// local variable definitions used for finding the API
var apiHandle = null;
var findAPITries = 0;
var noAPIFound = "false";
var API_Extended = null; //Added for exit 

// local variable used to keep from calling Terminate() more than once
var terminated = "false";

// local variable used by the content developer to debug
// This should be set to true during development to find errors.  However,
// This should be set to false prior to deployment.
var _debug = false;

// local variable to store the current and last interaction index
var interactionIndex = 0;
var lastinteractionIndex = 0;

//local variable to store the suspend data
var suspendData = "NA";

// local variable to store the lesson location
var locationData = "NA";

//local variable to store the Completion Status
var completionStatus = "not attempted";

// local variable to store the Assessment Score
var score = 0;

// local variables to store the assessment parameters
var minScore = 0;   // minimum score for the assessment
var maxScore = 100;   // maximum score for the assessment
var passingScore = 80;  // passing percentage for the assessment

// local variable to store initial screen status array
var screenStatusArr = new Array();

// local variable to store random assessment array
var randomAssessmentArr = new Array();

// local variable to store assessment attempt status
var retakeAssessment = false;

// local variable to store self check status array
var selfCheckStatusArr = new Array();

// local variable to store assessment status array
var assessmentStatusArr = new Array();

// local variable to store the evaluation status 
var evaluationVisited = false

// local variable to store the deep link condition. Set this to true if you want to redirect to the deep link after the course is terminated, else set it to false
var deepLink = false;

// local variable to store the deep link URL if the condition is true
var deepLinkURL = "";


/*******************************************************************************
**
** This function looks for an object named API in parent and opener windows
**
** Inputs:  Object - The Window Object
**
** Return:  Object - If the API object is found, it's returned, otherwise null
**          is returned
**
*******************************************************************************/
function FindAPI( win )
{

   while ((win.API == null) && (win.parent != null) && (win.parent != win))
   {
      findAPITries++;
      // Note: 7 is an arbitrary number, but should be more than sufficient
      if (findAPITries > 7) 
      {
         parent.status = "Error finding API -- too deeply nested.";

         return null;
      }
      
      win = win.parent;
      

   }
   API_Extended = win.API_Extended; // Find extended API for exit from LMS
   return win.API;
}

/*******************************************************************************
**
** This function looks for an object named API, first in the current window's
** frame hierarchy and then, if necessary, in the current window's opener window
** hierarchy (if there is an opener window).
**
** Inputs:  none
**
** Return:  Object - If the API object is found, it's returned, otherwise null
**                   is returned
**
*******************************************************************************/
function getAPI()
{
   var API = FindAPI(window);
   if ((API == null) && (window.opener != null) && (typeof(window.opener) != "undefined"))
   {
      API = FindAPI(window.opener);
   }
   if (API == null)
   {
     parent.status = "Unable to find an API adapter";
     
   }
    //alert(API);
    //window.hungOnApi = API;
    //alert(window.hungOnApi);
    
   return API;
}

/*******************************************************************************
**
** Returns the handle to API object if it was previously set, otherwise it
** returns null
**
** Inputs:  None
**
** Return:  Object - The value contained by the apiHandle variable.
**
*******************************************************************************/
function getAPIHandle()
{
  
   if ( apiHandle == null )
   {
    
      if ( noAPIFound == "false" )
      {
    
         apiHandle = getAPI();
     
      }
   }

   // This code is only for offline testing.
   //apiHandle = "123";

   return apiHandle;
}

/*******************************************************************************
**
** This function is used to tell the LMS to initiate the communication session.
**
** Inputs:  None
**
** Return:  String - "true" if the initialization was successful, or
**          "false" if the initialization failed.
**
*******************************************************************************/
function initializeCommunication()
{
  
   
   var api = getAPIHandle();

   if ( api == null )
   {
    //parent.status = "This is a standalone course. Tracking on the LMS is disabled.";
    //alert("This course is currently being viewed in Offline Mode. No tracking data will be passed to the LMS.");
      return "false";
   }
   else
   {
      var result = api.LMSInitialize("");

      if ( result != "true" )
      {
         var errCode = retrieveLastErrorCode();

         displayErrorInfo( errCode );

         // may want to do some error handling
      }
   }

   // Initialize the parameters from the LMS 

  completionStatus = api.LMSGetValue("cmi.core.lesson_status");
  
  var l_interactionIndex = api.LMSGetValue("cmi.interactions._count");  
  lastinteractionIndex = parseInt(l_interactionIndex);
  
  if ((completionStatus == "unknown") || (completionStatus == "not attempted") )
  {
    api.LMSSetValue("cmi.core.lesson_status", "incomplete");
    api.LMSSetValue("cmi.core.score.max", maxScore);
    api.LMSSetValue("cmi.core.score.min", minScore);
  } else { 

    locationData = api.LMSGetValue("cmi.core.lesson_location");
    suspendData = api.LMSGetValue("cmi.suspend_data");
    score = api.LMSGetValue("cmi.core.score.raw");
  }
  
  //alert("completionStatus: " + completionStatus + "  locationData: " + locationData + "  suspendData: " + suspendData + "  interactionIndex: " + interactionIndex);
  return result;
}

/***************************************************************
Suspend Data function will set appropriate language to suspend data
 SCORM_SuspendData()

 *****************************************************************/
function SCORM_SuspendData(){
    //alert("In suspend data function: ");
    var getSuspendData = fnGetSuspendData();
    //alert("In suspend data function: "+getSuspendData);
    if(getSuspendData == "" || getSuspendData == undefined || getSuspendData == null){
        //document.getElementById('initialPage').style.display = "block";
    }
    else {
        $(".popup-overlay-suspend").removeClass('display-none');
      $("#introVideo1")[0].pause();
    }


}


/***********************************************************************
Set language of the course
SCORM_SetLanguage()
************************************************************************/

function SCORM_SetLanguage(language){
    var api = getAPIHandle();
        //api = "123";
       // alert("In set suspend Data");
        if ( api == null )
        {
            return;
        }
        else
        {
            api.LMSSetValue("cmi.student_preference.language",language);
            //alert("suspendData: " + suspendData);
            // Do a commit after posting data for the entire interation
            //persistData();
        } 
        return;  
}


/*******************************************************************************
**
** This function is used to tell the LMS to terminate the communication session
**
** Inputs:  None
**
** Return:  String - "true" if successful or
**                   "false" if failed.
**
*******************************************************************************/
function terminateCommunication()
{  
   var api = getAPIHandle();

   if ( api == null )
   {
      return "false";
   }
   else
   {
      // call Terminate only if it was not previously called
      if ( terminated != "true" )
      {
        var suspendDataList = setSuspendDataForAllServices();

      suspendData = suspendDataList.toString();
      var locationData = suspendData;
     // Set the BookMark location 
     var result1 = api.LMSSetValue("cmi.suspend_data", suspendData);
     var result2 = api.LMSSetValue("cmi.core.lesson_location", locationData);
     var result3 = api.LMSSetValue("cmi.core.score.raw", score);
       //var normalizedScore = score / 100; 
     //var result4 = api.LMSSetValue("cmi.score.scaled", normalizedScore);

     // Do a final commit before termination the session
     persistData();

         // call the Terminate function that should be implemented by the API
         var result = api.LMSFinish("");
    
     if (completionStatus == "completed")
     {
      if (deepLink == true)
      {
        // call the function to open the deep link if present
        fnOpenDeepLink();
      }     
     }
    
         if ( (result1 != "true") || (result2 != "true") || (result3 != "true"))
         {
            var errCode = retrieveLastErrorCode();

            displayErrorInfo( errCode );

            // may want to do some error handling
         }
         else  // terminate was successful
         {
            terminated = "true";
         }
      }
   }

   return result;
}

/*******************************************************************************
**
** This function requests information from the LMS.
**
** Inputs:  String - Name of the data model defined category or element
**                   (e.g. cmi.core.learner_id)
**
** Return:  String - The value presently assigned to the specified data model
**                   element.
**
*******************************************************************************/
function retrieveDataValue( name )
{
   // do not call a set after finish was called
   if ( terminated != "true" )
   {
      var api = getAPIHandle();
      
      if ( api == null )
      {
         return;
      }
      else
      {
         var value = api.LMSGetValue( name );

         var errCode = api.LMSGetLastError();

         if ( errCode != "0" )
         {
            var errCode = retrieveLastErrorCode();

            displayErrorInfo( errCode );
         }
         else
         {
            return value;
         }
      }
   }

   return;
}

/*******************************************************************************
**
** This function is used to tell the LMS to assign the value to the named data
** model element.
**
** Inputs:  String - Name of the data model defined category or element value
**
**          String - The value that the named element or category will be
**                   assigned
**
** Return:  String - "true" if successful or
**                   "false" if failed.
**
*******************************************************************************/
function storeDataValue( name, value )
{
   // do not call a set after finish was called
   if ( terminated != "true" )
   {
      var api = getAPIHandle();

      if ( api == null )
      {
         return;
      }
      else
      {
     
     var result = api.LMSSetValue( name, value );

         if ( result != "true" )
         {
            var errCode = retrieveLastErrorCode();

            displayErrorInfo( errCode );

            // may want to do some error handling
         }
    }
   }

   return;
}

/*******************************************************************************
**
** This function requests the error code for the current error state from the
** LMS.
**
** Inputs:  None
**
** Return:  String - The last error code.
**
*******************************************************************************/
function retrieveLastErrorCode()
{
   // It is permitted to call GetLastError() after Terminate()

   var api = getAPIHandle();

   if ( api == null )
   {
      return;
   }
   else
   {
      return api.LMSGetLastError();
   }
}

/*******************************************************************************
**
** This function requests a textual description of the current error state from
** the LMS
**
** Inputs:  String - The error code.
**
** Return:  String - Textual description of the given error state.
**
*******************************************************************************/
function retrieveErrorInfo( errCode )
{
   // It is permitted to call GetLastError() after Terminate()

   var api = getAPIHandle();

   if ( api == null )
   {
      return;
   }
   else
   {

      return api.LMSGetErrorString( errCode );
   }
}

/*******************************************************************************
**
** This function requests additional diagnostic information about the given
** error code.  This information is LMS specific, but can help a developer find
** errors in the SCO.
**
** Inputs:  String - The error code.
**
** Return:  String - Additional diagnostic information about the given error
**                   code
**
*******************************************************************************/
function retrieveDiagnosticInfo( error )
{
   // It is permitted to call GetLastError() after Terminate()

   var api = getAPIHandle();

   if ( api == null )
   {
      return;
   }
   else
   {
      return api.LMSGetDiagnostic( error );
   }
}

/*******************************************************************************
**
** This function requests that the LMS persist all data to this point in the
** session.
**
** Inputs:  None
**
** Return:  None
**
*******************************************************************************/
function persistData()
{
   // do not call a set after Terminate() was called
   if ( terminated != "true" )
   {
      var api = getAPIHandle();

      if ( api == null )
      {
         return;
      }
      else
      {
         return api.LMSCommit("");
      }
   }
   else
   {
      return;
   }
   return;
}

/*******************************************************************************
**
** Display the last error code, error description and diagnostic information.
**
** Inputs:  String - The error code
**
** Return:  None
**
*******************************************************************************/
function displayErrorInfo( errCode )
{
   if ( _debug )
   {
      var errString = retrieveErrorInfo( errCode );
      var errDiagnostic = retrieveDiagnosticInfo( errCode );
  
      //alert( "ERROR: " + errCode + " - " + errString + "\n" +
         //    "DIAGNOSTIC: " + errDiagnostic );
   }
   return;
}



/*******************************************************************************
**
** This function is used to store the Initial Screen Status Array in a local variable
**
** Inputs:  Array - Initial Screen Status 
**
** Return:  null
**
*******************************************************************************/
//function fnSetInitialScreenStatusArr()
function fnSetInitialScreenStatusArr(llocationData, lScreenStatusArr, lselfCheckStatusArr, lassessmentStatusArr, lRandomAssessmentArr) 
{ 
  //alert("fnSetInitialScreenStatusArr");
  
   //alert("in fnSetInitialScreenStatusArr: " + "  locationData: " + locationData + "  lScreenStatusArr: " + lScreenStatusArr + "  lselfCheckStatusArr: " + lselfCheckStatusArr + "  lassessmentStatusArr: " + lassessmentStatusArr + "  lRandomAssessmentArr: " + lRandomAssessmentArr);

  if (llocationData != "NA")
  {
    locationData = parseInt(llocationData);
  }
  if (lScreenStatusArr != "undefined")
  {
    screenStatusArr = lScreenStatusArr.split(',');
  }
  if (lselfCheckStatusArr != "undefined")
  {
    selfCheckStatusArr = lselfCheckStatusArr.split(',');
  }
  if (lassessmentStatusArr != "undefined")
  {
    assessmentStatusArr = lassessmentStatusArr.split(',');
  }
  if (lRandomAssessmentArr != "NA")
  {
    randomAssessmentArr = lRandomAssessmentArr.split(',');
  } else 
  {
    randomAssessmentArr = "NA";
  }
  
    //alert("in fnSetInitialScreenStatusArr: " + "  locationData: " + locationData + "  screenStatusArr: " + screenStatusArr + "  selfCheckStatusArr: " + selfCheckStatusArr + "  assessmentStatusArr: " + assessmentStatusArr + "  randomAssessmentArr: " + randomAssessmentArr);

  /*
  var lTemp1 = suspendData.split("^^");
  screenStatusArr = lTemp1[0].split(",");
  
  var lTemp2 = lTemp1[1].split("~~");
  selfCheckStatusArr = lTemp2[0].split(",");
  
  var lTemp3 = lTemp2[1].split("**"); 
  assessmentStatusArr = lTemp3[0].split(","); 
  
  randomAssessmentArr = lTemp3[1].split(","); 
  
  */
  //alert("screenStatusArr: " + screenStatusArr);
  fnSetLocationData();
  fnSetSuspendData();
  

  
  //alert("fnSetInitialScreenStatusArr: " + screenStatusArr);
  return;
}


/*******************************************************************************
**
** This function is used to store the individual screen status for the particular screen
**
** Inputs:  Screen Number, Screen Status 
**
** Return:  null
**
*******************************************************************************/
function fnSetIndividualScreenStatus(lCurrentScreen, lScreenStatus, lretakeAssessment) 
{
  
  if (lretakeAssessment == "true")
  {
    for (var i=0;i<assessmentStatusArr.length;i++)
    {
      var ltemp1 = assessmentStatusArr[i].split('||');
      var lCurrentScreen_int = parseInt(ltemp1[0]);
      var lScreenStatus_int = 2;
      screenStatusArr[lCurrentScreen_int] = lScreenStatus_int;
    }
    fnSetAssessmentScore(0);
    assessmentStatusArr = new Array();
  }
  
  /*
  if (lretakeAssessment == "true")
  {
    retakeAssessment = true;
    for (var i=0;i<assessmentStatusArr.length;i++)
    {
      var ltemp1 = assessmentStatusArr[i].split('##');
      interactionIndex = parseInt(ltemp1[1]);   
      var interaction_id = "cmi.interactions." + interactionIndex + ".id";
      var interaction_type = "cmi.interactions." + interactionIndex + ".type";
      var interaction_sr = "cmi.interactions." + interactionIndex + ".student_response";
      var interaction_result = "cmi.interactions." + interactionIndex + ".result";
      
      
      var result = storeDataValue(interaction_id, lInteractionID);
      var result = storeDataValue(interaction_type, lInteractionType);
      var result = storeDataValue(interaction_sr, lInteractionResponse);
      var result = storeDataValue(interaction_result, lInteractionResult);
    }
  }
  */
  //alert("retakeAssessment: " + retakeAssessment);
  //alert("lCurrentScreen: " + lCurrentScreen + "  lScreenStatus: " + lScreenStatus);
  var lCurrentScreen_int = parseInt(lCurrentScreen);
  var lScreenStatus_int = parseInt(lScreenStatus);
  screenStatusArr[lCurrentScreen_int] = lScreenStatus_int;

  locationData = lCurrentScreen_int;
  fnSetLocationData();

  //alert("screenStatusArr[lCurrentScreen]: " + screenStatusArr[lCurrentScreen_int]);
  
  fnSetSuspendData();
  
  
  return;
}

/*******************************************************************************
**
** This function is used to store the individual screen status for the particular screen
**
** Inputs:  Screen Number, Screen Status 
**
** Return:  null
**
*******************************************************************************/
function fnSetCurrentScreenStatus(lCurrentScreen) 
{
  //alert("lCurrentScreen: " + lCurrentScreen + "  lScreenStatus: " + lScreenStatus);
  var lCurrentScreen_int = parseInt(lCurrentScreen);

  locationData = lCurrentScreen_int;
  fnSetLocationData();
  
  //alert("fnSetCurrentScreenStatus: " + lCurrentScreen); 
  return;
}


/*******************************************************************************
**
** This function is used to store the individual self check status for the particular self check in the selfcheckstatus array
**
** Inputs:  Screen Number, Self Check Response 
**
** Return:  null
**
*******************************************************************************/
function fnSetIndividualSelfCheckStatus(lCurrentScreen, lSelfCheckResponse) 
{
  //alert("selfCheckStatusArr: " + selfCheckStatusArr);

  var lValue = lCurrentScreen + "||" + lSelfCheckResponse;
  selfCheckStatusArr.push(lValue);

  var lCurrentScreen_int = parseInt(lCurrentScreen);
  locationData = lCurrentScreen_int;
  fnSetLocationData();
  
  var lScreenStatus_int = parseInt(4);
  screenStatusArr[lCurrentScreen_int] = lScreenStatus_int;

  fnSetSuspendData();
  
  //alert("fnSetIndividualSelfCheckStatus: " + lCurrentScreen + "  " + lSelfCheckResponse); 
  return;

}



/*******************************************************************************
**
** This function is used to store the individual self check status for the particular self check in the selfcheckstatus array
**
** Inputs:  Screen Number, Self Check Response 
**
** Return:  null
**
*******************************************************************************/
function fnSetIndividualAssessmentStatus(lCurrentScreen, lInteractionID, lInteractionType, lInteractionResponse, lInteractionResult, lCurrentScore) 
{
  
    //alert("fnSetIndividualAssessmentStatus: " + lCurrentScreen + "  " + lInteractionID + "  " + lInteractionType + "  " + lInteractionResponse + "  " + lInteractionResult + "  " + lCurrentScore + "  " + interactionIndex); 
      var api = getAPIHandle();
   
      if ( api == null )
      {
         return;
      }
      else
      {        
      /*
      //alert("in fnSetIndividualAssessmentStatus: retakeAssessment: " + retakeAssessment);
      var lcurrentAssessmentIndex = -1;
      for (var i=0;i<assessmentStatusArr.length;i++)
      {
        var ltemp1 = assessmentStatusArr[i].split('||');
        
        if (ltemp1[0] == lCurrentScreen)
        {
          lcurrentAssessmentIndex = i;
          i = 1000;
          break;
        }
      }
      if (lcurrentAssessmentIndex != -1)
      {
        var ltemp2 = assessmentStatusArr[lcurrentAssessmentIndex].split('##');
        interactionIndex = parseInt(ltemp2[1]);   
        //alert("interactionIndex: " + interactionIndex);
      } else {
        interactionIndex = lastinteractionIndex;
      }    
      */
      interactionIndex = lastinteractionIndex;

      var interaction_id = "cmi.interactions." + interactionIndex + ".id";
      var interaction_type = "cmi.interactions." + interactionIndex + ".type";
      var interaction_sr = "cmi.interactions." + interactionIndex + ".student_response";
      var interaction_result = "cmi.interactions." + interactionIndex + ".result";
      
      
      var result = storeDataValue(interaction_id, lInteractionID);
      var result = storeDataValue(interaction_type, lInteractionType);
      var result = storeDataValue(interaction_sr, lInteractionResponse);
      var result = storeDataValue(interaction_result, lInteractionResult);
      
      //alert("fnSetIndividualAssessmentStatus: " + lCurrentScreen + "  " + lInteractionID + "  " + lInteractionType + "  " + lInteractionResponse + "  " + lInteractionResult + "  " + lCurrentScore + "  " + interactionIndex); 
      
      fnSetAssessmentScore(lCurrentScore);
      
      var lValue = lCurrentScreen + "||" + lInteractionResponse + "$$" + lInteractionResult + "##" + interactionIndex;
      assessmentStatusArr.push(lValue);
          
      var lCurrentScreen_int = parseInt(lCurrentScreen);
      locationData = lCurrentScreen_int;
      fnSetLocationData();
      
      var lScreenStatus_int = parseInt(4);
      screenStatusArr[lCurrentScreen_int] = lScreenStatus_int;

      fnSetSuspendData();
      
      /*
      if ( result != "true" )
      {
        var errCode = retrieveLastErrorCode();
        displayErrorInfo( errCode );
        // may want to do some error handling
      }
      */
      // Do a commit after posting data for the entire interation
      persistData();
      
      interactionIndex++;
      lastinteractionIndex = interactionIndex;

      //alert("lastinteractionIndex: " + lastinteractionIndex);

     }
  return;
}



/*******************************************************************************
**
** This function is used to store the assessment score in a local variable and send it to LMS
**
** Inputs:  String - assessment score
**
** Return:  null
**
*******************************************************************************/
function fnSetAssessmentScore(lValue) 
{
  score = parseInt(lValue);
  var api = getAPIHandle();
    //alert("API: "+api);
  if ( api == null )
    {
    return;
    }
    else
    {
    var result1 = api.LMSSetValue("cmi.core.score.raw", score);
            if(score >= passingScore){
                fnSetCompletionStatus();
            }
        
  }
  
  // Do a final commit before termination the session
  persistData();
  //alert("fnSetAssessmentScore: " + lValue); 
  return;
}

function SCORM_SetScore(mValue){
  var apiRef = getAPIHandle();
    
  //alert(apiRef);
  
    if ( apiRef == null )
    {
        return;
    }
    else
    {
    score = parseInt(mValue);
  
        var result1 = apiRef.LMSSetValue("cmi.core.score.raw", score);

        if(score >= passingScore){
            SCORM_SetCompletionStatus(apiRef);
        }

    }

    // Do a final commit before termination the session
    persistData();
    //alert("fnSetAssessmentScore: " + lValue);
    return;
}

function SCORM_SetCompletionStatus(apiRef)
{
    //var api = getAPIHandle();

    if ( apiRef == null )
    {
        return;
    }
    else
    {
        if (completionStatus != "completed"){
            apiRef.LMSSetValue("cmi.core.lesson_status", "completed");
            completionStatus = "completed";
            persistData();
            //api.LMSSetValue("cmi.core.exit","logout")
        }
    }


    //alert("fnSetCompletionStatus: ");
    return;
}

function SCORM_SetCompletion(){
  var apiRef = getAPIHandle();
  SCORM_SetCompletionStatus(apiRef);
}

/*******************************************************************************
**
** This function is used to mark the course as complete in the LMS
**
** Inputs:  No
**
** Return:  cmi.completion_status -> completed
**
*******************************************************************************/
function fnSetCompletionStatus(){

  var api = getAPIHandle();

  if ( api == null )
    {
    return;
    }
    else
    { 
    if (completionStatus != "completed"){ 
      api.LMSSetValue("cmi.core.lesson_status", "completed");
      completionStatus = "completed";
      persistData();
    //api.LMSSetValue("cmi.core.exit","logout")
    }
  }
  
  
  //alert("fnSetCompletionStatus: ");
  return;
}


/*******************************************************************************
**
** This function is used to store suspend information for the SCO 
**
** Inputs: String - The value that the named element or category will be
**                   assigned
**
** Return:  String - "true" if successful or
**                   "false" if failed.
**
*******************************************************************************/

/*function fnSetSuspendData()
{  
   // do not call a set after finish was called
   if ( terminated != "true" )
   {
      var api = getAPIHandle();
    //api = "123";
      if ( api == null )
      {
         return;
      }
      else
      {   
        suspendData = screenStatusArr + "^^" + selfCheckStatusArr + "~~" + assessmentStatusArr + "**" + randomAssessmentArr;
    api.LMSSetValue("cmi.suspend_data",suspendData);
    //alert("suspendData: " + suspendData);
    // Do a commit after posting data for the entire interation
    persistData();
      } 
   }  
   //alert("suspendData: " + suspendData);
   return;
}*/

/*******************************************************************************
 **
 ** This function is used to get suspend information for the SCO
 **
 ** Inputs: String - The value that the named element or category will be
 **                   assigned
 **
 ** Return:  String - "true" if successful or
 **                   "false" if failed.
 **
 *******************************************************************************/

function fnGetSuspendData()
{
    // do not call a set after finish was called
    if ( terminated != "true" )
    {
        var api = getAPIHandle();
        //api = "123";
        if ( api == null )
        {
            return;
        }
        else
        {

            suspendData = api.LMSGetValue("cmi.suspend_data");
            //alert("suspendData: " + suspendData);
            // Do a commit after posting data for the entire interation
            //persistData();
        }
    }
    //alert("suspendData: " + suspendData);
    return suspendData;
}

/*******************************************************************************
 **
 ** This function is used to set suspend information for the SCO
 **
 ** Inputs: String - The value that the named element or category will be
 **                   assigned
 **
 ** Return:  String - "true" if successful or
 **                   "false" if failed.
 **
 *******************************************************************************/

function SCORM_SetSuspendData(setSuspendData)
{
    /******* Test Mob******************
    $(".popup-overlay-window-close").find(".Popup-wrap").prepend('<h5>Set suspendData..'+setSuspendData+' </h5>');
    /******* Test Mob*******************/
    
    // do not call a set after finish was called
    if ( terminated != "true" )
    {
        var api = getAPIHandle();
        //api = "123";
       // alert("In set suspend Data");
        if ( api == null )
        {
            return;
        }
        else
        {
            api.LMSSetValue("cmi.suspend_data",setSuspendData);
            //alert("suspendData: " + suspendData);
            // Do a commit after posting data for the entire interation
            persistData();
            /******* Test Mob******************
            $(".popup-overlay-window-close").find(".Popup-wrap").prepend('<h5>Set suspendData..'+api.LMSGetValue("cmi.suspend_data")+' </h5>');
            /******* Test Mob*******************/
        }
    }
    //alert("suspendData: " + suspendData);
    return;
}



/*******************************************************************************
**
** This function is used to store suspend information for the SCO 
**
** Inputs: String - The value that the named element or category will be
**                   assigned
**
** Return:  String - "true" if successful or
**                   "false" if failed.
**
*******************************************************************************/

function fnSetLocationData( )
{  
   // do not call a set after finish was called
   if ( terminated != "true" )
   {
      var api = getAPIHandle();
    //api = "123";
      if ( api == null )
      {
         return;
      }
      else
      {           
    api.LMSSetValue("cmi.core.lesson_location",locationData)
    //alert("locationData: " + locationData);
    // Do a commit after posting data for the entire interation
    persistData();
      } 
   }  
   return;
}


/*******************************************************************************
**
** This function is used to store suspend information for the SCO 
**
** Inputs: String - The value that the named element or category will be
**                   assigned
**
** Return:  String - "true" if successful or
**                   "false" if failed.
**
*******************************************************************************/

function fnGetLMSData( )
{  

   // do not call a set after finish was called
   var api = getAPIHandle();
   //api = "123";
   if ( api == null )
   {
      var LMSData = locationData + "@@" + suspendData;
        //LMSData = "45@@4,4,4,2,2,2,2,4,2,2,2,4,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,2,2,2,2,2,2,2,4,4,4,2,2,2,2,2,2,3,2,2,2^^7||5|1|3|2|4|,11||0|1|2|~~28||0|$$wrong##0,36||0|$$correct##1,37||1|$$correct##2,38||0|$$wrong##3**28,36,37,38,45";
    return LMSData;
   }
   else
   {
    var LMSData = locationData + "@@" + suspendData;
    //LMSData = "45@@4,4,4,2,2,2,2,4,2,2,2,4,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,2,2,2,2,2,2,2,4,4,4,2,2,2,2,2,2,3,2,2,2^^7||5|1|3|2|4|,11||0|1|2|~~28||0|$$wrong##0,36||0|$$correct##1,37||1|$$correct##2,38||0|$$wrong##3**28,36,37,38,45";
    return LMSData;
   }
        
}

function fnGetCompletionStatus()
{
  
  //completionStatus = "incomplete";
   // do not call a set after finish was called
   var api = getAPIHandle();
   //api = "123";
   if ( api == null )
   {  
        return completionStatus;
   }
   else
   {
    return completionStatus;
   }

}


function fnExit()
{
  if( API_Extended != null)
  {
    //finish();
    var can_nav_exit = API_Extended.GetNavCommandStatus("exit");
    if(can_nav_exit == true)
    {
      API_Extended.SetNavCommand("exit");
    }
    //top.close();
  }else{
    top.close();
  } 
  //alert("API_Extended: " + API_Extended);
}


/*******************************************************************************
**
** This function is used to get the open a deep link when the course window is closed 
**
*******************************************************************************/

function fnOpenDeepLink(){
  
  if (deepLink == true){
    //alert("in deep link")
    var theURL = deepLinkURL;
    var winName = "Insert Window Name"
    var browser_width  = 1024;
    var browser_height = 768;
    var startw = ((screen.Width/2)-  parseInt(browser_width/2));
    var starth = ((screen.Height/2-(30))- parseInt(browser_height/2));
    var winHeight = browser_height;
    var winWidth = browser_width;
    var scrollerFlag = 1
    var mwin=window.open(theURL,winName,'toolbar=0,location=0,directories=0,status=0,menubar=0,scrollbars='+scrollerFlag+',resizable=1,width='+winWidth+',height='+winHeight+',left='+ startw +',top=' + starth)
  } 
  return;
}


function fnunload(){
  //alert("unload..");
}
