$(function () {
	$("#filter a").hover(
		function () {
			$(this).addClass("seling");
		},
		function () {
			$(this).removeClass("seling");
		}
	);

	$("#filter dt+dd a").attr("class", "seled"); 
	$("#filter a").click(function () {
		$(this).parents("dl").children("dd").each(function () {
			$(this).children("div").children("a").removeClass("seled");
		});

		$(this).attr("class", "seled");

		alert(RetSelecteds()); 
	});
	alert(RetSelecteds()); 
});

function RetSelecteds() {
	var result = "";
	$("#filter a[class='seled']").each(function () {
		result += $(this).html()+"\n";
	});
	return result;
}
