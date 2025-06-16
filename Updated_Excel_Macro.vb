Option Explicit

' API Configuration
Public Const API_BASE_URL As String = "http://localhost:3001/api"

' Store your credentials here (or in Excel cells for security)
Public Const API_EMAIL As String = "your_email@domain.com"
Public Const API_PASSWORD As String = "your_password"

' Or store credentials in Excel cells (more secure)
' Public Function GetEmail() As String
'     GetEmail = Sheet1.Range("AA1").Value
' End Function
' Public Function GetPassword() As String
'     GetPassword = Sheet1.Range("AA2").Value
' End Function

Public AuthToken As String
Public TokenExpiry As Date

' Automatic authentication function
Private Function EnsureAuthenticated() As Boolean
    ' Check if we have a valid token that hasn't expired
    If AuthToken <> "" And Now < TokenExpiry Then
        EnsureAuthenticated = True
        Exit Function
    End If
    
    ' Check credentials are set
    If API_EMAIL = "your_email@domain.com" Or API_PASSWORD = "your_password" Then
        MsgBox "Please set your API credentials in the API_EMAIL and API_PASSWORD constants."
        EnsureAuthenticated = False
        Exit Function
    End If
    
    ' Authenticate
    EnsureAuthenticated = AuthenticateWithAPI(API_EMAIL, API_PASSWORD)
End Function

' API Authentication function
Private Function AuthenticateWithAPI(email As String, password As String) As Boolean
    Dim http As Object
    Dim jsonData As String
    Dim response As String
    
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    ' Prepare login data
    jsonData = "{""email"":""" & email & """,""password"":""" & password & """}"
    
    ' Make login request
    http.Open "POST", API_BASE_URL & "/auth/login", False
    http.setRequestHeader "Content-Type", "application/json"
    http.send jsonData
    
    If http.Status = 200 Then
        ' Parse response to get token
        response = http.responseText
        ' Extract token from JSON response (simple parsing)
        Dim tokenStart As Integer, tokenEnd As Integer
        tokenStart = InStr(response, """token"":""") + 9
        tokenEnd = InStr(tokenStart, response, """")
        AuthToken = Mid(response, tokenStart, tokenEnd - tokenStart)
        
        ' Set token expiry (23 hours from now to be safe)
        TokenExpiry = Now + TimeSerial(23, 0, 0)
        
        AuthenticateWithAPI = True
    Else
        MsgBox "Authentication failed: " & http.responseText
        AuthenticateWithAPI = False
    End If
End Function

' Main export function - updated for new API
Public Sub ExportToLeads()
    Dim propertyId As String
    Dim propFound As Boolean
    Dim isInspection As Boolean
    Dim jobTR As String
    
    ' Ensure we're authenticated
    If Not EnsureAuthenticated() Then
        Exit Sub
    End If
    
    ' Checks to see if Pest/Sen and Real Estate Trans boxes are neutral
    If Sheet1.Shapes("RealEstateTrans").OLEFormat.Object.Value = 2 Or Sheet1.Shapes("PestSenCustomer").OLEFormat.Object.Value = 2 Then
        MsgBox ("Please make sure you fill out the Real Estate Transaction and the Pest Sentricon customer boxes!")
        Exit Sub
    End If
    
    ' Setting Job TR
    jobTR = Sheet1.Range("AC18")
    
    ' Checking for Property using the new API
    propertyId = GetPropertyByAcctNum(jobTR)
    If propertyId <> "" Then
        propFound = True
    Else
        propFound = False
    End If
    
    If Not propFound Then
        ' Insert New Property
        propertyId = InsertPropertyAPI()
        If propertyId = "" Then
            MsgBox "Failed to create property"
            Exit Sub
        End If
        
        ' Add Contacts
        Call AddContactsAPI(propertyId)
    Else
        ' Update property status if needed
        Call UpdatePropertyStatusAPI(propertyId)
    End If
    
    ' Checking for existing inspection
    isInspection = CheckForInspectionAPI(propertyId)
    If Not isInspection Then
        Call InsertInspectionAPI(propertyId)
    Else
        MsgBox ("This inspection has previously been entered!")
    End If
End Sub

' Get property by account number using API
Public Function GetPropertyByAcctNum(acctNum As String) As String
    Dim http As Object
    Dim response As String
    Dim searchUrl As String
    
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    ' Search for property by account number (using search parameter)
    searchUrl = API_BASE_URL & "/properties?search=" & acctNum
    
    http.Open "GET", searchUrl, False
    http.setRequestHeader "Authorization", "Bearer " & AuthToken
    http.setRequestHeader "Content-Type", "application/json"
    http.send
    
    If http.Status = 200 Then
        response = http.responseText
        ' Parse response to find property ID
        ' This is a simplified JSON parsing - you might want to use a proper JSON parser
        If InStr(response, """properties"":[{") > 0 Then
            Dim idStart As Integer, idEnd As Integer
            idStart = InStr(response, """id"":""") + 6
            idEnd = InStr(idStart, response, """")
            GetPropertyByAcctNum = Mid(response, idStart, idEnd - idStart)
        Else
            GetPropertyByAcctNum = ""
        End If
    Else
        GetPropertyByAcctNum = ""
    End If
End Function

' Insert property using API
Public Function InsertPropertyAPI() As String
    Dim http As Object
    Dim jsonData As String
    Dim response As String
    
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    ' Prepare property data
    jsonData = "{" & _
        """address"":""" & Sheet1.Range("AC9") & """," & _
        """city"":""" & Sheet1.Range("AC10") & """," & _
        """state"":""" & Sheet1.Range("AC11") & """," & _
        """zipCode"":""" & Sheet1.Range("AC12") & """," & _
        """propertyType"":""RESIDENTIAL""," & _
        """description"":""Account: " & Sheet1.Range("AC18") & """" & _
        "}"
    
    http.Open "POST", API_BASE_URL & "/properties", False
    http.setRequestHeader "Authorization", "Bearer " & AuthToken
    http.setRequestHeader "Content-Type", "application/json"
    http.send jsonData
    
    If http.Status = 201 Then
        response = http.responseText
        ' Extract property ID from response
        Dim idStart As Integer, idEnd As Integer
        idStart = InStr(response, """id"":""") + 6
        idEnd = InStr(idStart, response, """")
        InsertPropertyAPI = Mid(response, idStart, idEnd - idStart)
    Else
        MsgBox "Failed to create property: " & http.responseText
        InsertPropertyAPI = ""
    End If
End Function

' Update property status using API
Public Function UpdatePropertyStatusAPI(propertyId As String)
    ' Note: The new API doesn't have a "status" field like the old database
    ' You might need to add this field to your schema or handle it differently
    ' For now, this function is a placeholder
End Function

' Check for existing inspection using API
Public Function CheckForInspectionAPI(propertyId As String) As Boolean
    Dim http As Object
    Dim response As String
    Dim inspectionDate As String
    Dim inspectionType As String
    
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    ' Get inspection type and date
    inspectionDate = Format(Sheet1.Range("M7"), "yyyy-mm-dd")
    inspectionType = GetInspectionType()
    
    ' Search for inspections for this property
    http.Open "GET", API_BASE_URL & "/inspections?propertyId=" & propertyId, False
    http.setRequestHeader "Authorization", "Bearer " & AuthToken
    http.setRequestHeader "Content-Type", "application/json"
    http.send
    
    If http.Status = 200 Then
        response = http.responseText
        ' Check if there's already an inspection for this date and type
        If InStr(response, inspectionDate) > 0 And InStr(response, inspectionType) > 0 Then
            CheckForInspectionAPI = True
        Else
            CheckForInspectionAPI = False
        End If
    Else
        CheckForInspectionAPI = False
    End If
End Function

' Add contacts using API
Public Function AddContactsAPI(propertyId As String)
    Dim ownerOrderedBy As Boolean
    Dim realtor1Type As String, realtor2Type As String
    
    ' Add Owner Contact
    ownerOrderedBy = (Sheet1.Range("AC24") = 1)
    Call InsertContactAPI(propertyId, "Owner", Sheet1.Range("AC20"), Sheet1.Range("AC8"), Sheet1.Range("AC23"), Sheet1.Range("AC47"), ownerOrderedBy)
    
    ' Add Realtor 1 Contact
    If Sheet1.Range("AC33") <> "" Then
        If Sheet1.Range("AC43") = 1 Then
            realtor1Type = "Buyers Realtor"
        ElseIf Sheet1.Range("AC45") = 1 Then
            realtor1Type = "Sellers Realtor"
        End If
        Call InsertContactAPI(propertyId, realtor1Type, Sheet1.Range("AC33"), Sheet1.Range("AC13"), Sheet1.Range("AC35"), Sheet1.Range("AC40"), (Sheet1.Range("AC25") = 1))
    End If
    
    ' Add Realtor 2 Contact
    If Sheet1.Range("AC34") <> "" Then
        If Sheet1.Range("AC44") = 1 Then
            realtor2Type = "Buyers Realtor"
        ElseIf Sheet1.Range("AC42") = 1 Then
            realtor2Type = "Sellers Realtor"
        End If
        Call InsertContactAPI(propertyId, realtor2Type, Sheet1.Range("AC34"), Sheet1.Range("AC14"), Sheet1.Range("AC36"), Sheet1.Range("AC41"), (Sheet1.Range("AC26") = 1))
    End If
    
    ' Add POI Contact
    If Sheet1.Range("AC37") <> "" Then
        Call InsertContactAPI(propertyId, "POI", Sheet1.Range("AC37"), Sheet1.Range("AC16"), Sheet1.Range("AC39"), Sheet1.Range("AC38"), (Sheet1.Range("AC27") = 1))
    End If
End Function

' Insert contact using API
Public Function InsertContactAPI(propertyId As String, contactType As String, contactName As String, contactEmail As String, contactPhone1 As String, contactPhone2 As String, isPrimary As Boolean)
    Dim http As Object
    Dim jsonData As String
    
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    ' Clean and validate inputs
    contactName = Trim(contactName)
    contactEmail = Trim(contactEmail)
    contactPhone1 = Trim(contactPhone1)
    contactPhone2 = Trim(contactPhone2)
    
    ' Skip if no name provided
    If contactName = "" Then
        Exit Function
    End If
    
    ' Build JSON data - only include email if it's valid
    jsonData = "{" & _
        """propertyId"":""" & propertyId & """," & _
        """name"":""" & EscapeJsonString(contactName) & """," & _
        """role"":""" & contactType & """," & _
        """isPrimary"":" & LCase(CStr(isPrimary))
    
    ' Only add email if it looks like a valid email
    If IsValidEmail(contactEmail) Then
        jsonData = jsonData & ",""email"":""" & EscapeJsonString(contactEmail) & """"
    End If
    
    ' Only add phone if not empty
    If contactPhone1 <> "" Then
        jsonData = jsonData & ",""phone"":""" & EscapeJsonString(contactPhone1) & """"
    End If
    
    ' Add notes with second phone if available
    Dim notes As String
    If contactPhone2 <> "" Then
        notes = "Phone2: " & contactPhone2
        jsonData = jsonData & ",""notes"":""" & EscapeJsonString(notes) & """"
    End If
    
    jsonData = jsonData & "}"
    
    http.Open "POST", API_BASE_URL & "/contacts", False
    http.setRequestHeader "Authorization", "Bearer " & AuthToken
    http.setRequestHeader "Content-Type", "application/json"
    http.send jsonData
    
    If http.Status <> 201 Then
        MsgBox "Failed to create contact (" & contactName & "): " & http.responseText
    End If
End Function

' Helper function to validate email format
Private Function IsValidEmail(email As String) As Boolean
    If email = "" Or email = "none" Or email = "N/A" Then
        IsValidEmail = False
        Exit Function
    End If
    
    ' Simple email validation - contains @ and at least one dot after @
    Dim atPos As Integer
    Dim dotPos As Integer
    
    atPos = InStr(email, "@")
    If atPos <= 1 Then
        IsValidEmail = False
        Exit Function
    End If
    
    dotPos = InStr(atPos, email, ".")
    If dotPos <= atPos + 1 Or dotPos >= Len(email) Then
        IsValidEmail = False
        Exit Function
    End If
    
    IsValidEmail = True
End Function

' Helper function to escape JSON strings
Private Function EscapeJsonString(str As String) As String
    ' Replace common problematic characters in JSON strings
    str = Replace(str, "\", "\\")
    str = Replace(str, """", "\""")
    str = Replace(str, Chr(13), "\r")
    str = Replace(str, Chr(10), "\n")
    str = Replace(str, Chr(9), "\t")
    EscapeJsonString = str
End Function

' Insert inspection using API
Public Function InsertInspectionAPI(propertyId As String)
    Dim http As Object
    Dim jsonData As String
    Dim inspectionType As String
    Dim inspectionDate As String
    Dim cost As String
    Dim employeeId As String
    Dim inspectorId As String
    
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    ' Get inspection details
    inspectionType = GetInspectionType()
    inspectionDate = Format(Sheet1.Range("M7"), "yyyy-mm-ddThh:mm:ss.000Z")
    cost = Sheet1.Range("AC32")
    If cost = "" Then cost = "0"
    
    ' Get employee ID from the worksheet (from original macro: EmpId = Sheet1.Range("AC22"))
    employeeId = Trim(CStr(Sheet1.Range("AC22")))
    
    ' Validate required fields
    If employeeId = "" Then
        MsgBox "Employee ID is required (cell AC22 is empty). Please fill in your employee number (e.g., 801)."
        Exit Function
    End If
    
    ' Look up the actual user UUID using the employee ID
    inspectorId = GetInspectorIdByEmployeeId(employeeId)
    If inspectorId = "" Then
        MsgBox "Inspector not found for employee ID: " & employeeId & ". Please check your employee number or contact your administrator."
        Exit Function
    End If
    
    ' Prepare inspection data
    jsonData = "{" & _
        """propertyId"":""" & propertyId & """," & _
        """inspectorId"":""" & inspectorId & """," & _
        """scheduledDate"":""" & inspectionDate & """," & _
        """inspectionType"":""" & inspectionType & """," & _
        """status"":""COMPLETED""," & _
        """cost"":" & cost & "," & _
        """findings"":""""," & _
        """recommendations"":""""" & _
        "}"
    
    http.Open "POST", API_BASE_URL & "/inspections", False
    http.setRequestHeader "Authorization", "Bearer " & AuthToken
    http.setRequestHeader "Content-Type", "application/json"
    http.send jsonData
    
    If http.Status = 201 Then
        MsgBox "Inspection exported successfully!"
    Else
        MsgBox "Failed to create inspection: " & http.responseText
    End If
End Function

' Helper function to get inspector UUID by employee ID
Private Function GetInspectorIdByEmployeeId(employeeId As String) As String
    Dim http As Object
    Dim response As String
    
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    ' Look up user by employee ID
    http.Open "GET", API_BASE_URL & "/users/by-employee/" & employeeId, False
    http.setRequestHeader "Authorization", "Bearer " & AuthToken
    http.setRequestHeader "Content-Type", "application/json"
    http.send
    
    If http.Status = 200 Then
        response = http.responseText
        ' Parse response to get user ID
        Dim idStart As Integer, idEnd As Integer
        idStart = InStr(response, """id"":""") + 6
        idEnd = InStr(idStart, response, """")
        GetInspectorIdByEmployeeId = Mid(response, idStart, idEnd - idStart)
    Else
        GetInspectorIdByEmployeeId = ""
    End If
End Function

' Helper function to get inspection type
Private Function GetInspectionType() As String
    Select Case UCase(Sheet1.Range("AC31"))
        Case "FULL"
            GetInspectionType = "WDO"
        Case "LIMITED"
            GetInspectionType = "TERMITE"
        Case "SUPPLEMENTAL"
            GetInspectionType = "PEST"
        Case "REINSPECTION"
            GetInspectionType = "WDO"
        Case Else
            GetInspectionType = "WDO"
    End Select
End Function

' Helper function to test API connection
Public Sub TestAPIConnection()
    If Not EnsureAuthenticated() Then
        Exit Sub
    End If
    
    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    http.Open "GET", API_BASE_URL & "/properties?limit=1", False
    http.setRequestHeader "Authorization", "Bearer " & AuthToken
    http.setRequestHeader "Content-Type", "application/json"
    http.send
    
    If http.Status = 200 Then
        MsgBox "API connection successful! Ready to export data."
    Else
        MsgBox "API connection failed: " & http.responseText & " (Status: " & http.Status & ")"
    End If
End Sub

' Helper function to list all users and find inspector IDs
Public Sub ListAvailableInspectors()
    If Not EnsureAuthenticated() Then
        Exit Sub
    End If
    
    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    http.Open "GET", API_BASE_URL & "/users", False
    http.setRequestHeader "Authorization", "Bearer " & AuthToken
    http.setRequestHeader "Content-Type", "application/json"
    http.send
    
    If http.Status = 200 Then
        Dim response As String
        response = http.responseText
        
        ' Display the response so you can see available user IDs
        MsgBox "Available Users (copy this to find your inspector ID): " & vbCrLf & vbCrLf & response
        
        ' Also try to extract user info in a more readable format
        Call ParseAndDisplayUsers(response)
    Else
        MsgBox "Failed to get users: " & http.responseText & " (Status: " & http.Status & ")"
    End If
End Sub

' Helper to parse and display users in a more readable format
Private Sub ParseAndDisplayUsers(response As String)
    Dim userList As String
    Dim startPos As Integer
    Dim endPos As Integer
    
    userList = "Available Inspector IDs:" & vbCrLf & vbCrLf
    
    ' Simple parsing to extract user info
    startPos = 1
    Do While True
        startPos = InStr(startPos, response, """id"":""")
        If startPos = 0 Then Exit Do
        
        startPos = startPos + 6
        endPos = InStr(startPos, response, """")
        Dim userId As String
        userId = Mid(response, startPos, endPos - startPos)
        
        ' Try to find the corresponding name
        Dim nameStart As Integer
        Dim nameEnd As Integer
        nameStart = InStr(endPos, response, """firstName"":""")
        If nameStart > 0 Then
            nameStart = nameStart + 13
            nameEnd = InStr(nameStart, response, """")
            Dim firstName As String
            firstName = Mid(response, nameStart, nameEnd - nameStart)
            
            nameStart = InStr(nameEnd, response, """lastName"":""")
            If nameStart > 0 Then
                nameStart = nameStart + 12
                nameEnd = InStr(nameStart, response, """")
                Dim lastName As String
                lastName = Mid(response, nameStart, nameEnd - nameStart)
                
                userList = userList & "ID: " & userId & " - " & firstName & " " & lastName & vbCrLf
            End If
        End If
        
        startPos = endPos
    Loop
    
    If Len(userList) > 50 Then
        MsgBox userList
    End If
End Sub

' Manual login function (if you prefer to enter credentials each time)
Public Sub ManualLogin()
    Dim email As String
    Dim password As String
    
    email = InputBox("Enter your email:")
    If email = "" Then Exit Sub
    
    password = InputBox("Enter your password:")
    If password = "" Then Exit Sub
    
    If AuthenticateWithAPI(email, password) Then
        MsgBox "Authentication successful! Token will be valid for 24 hours."
    Else
        MsgBox "Authentication failed. Please check your credentials."
    End If
End Sub 